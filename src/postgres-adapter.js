const assert = require('assert');
const groupBy = require('lodash.groupby');
const { applySorts, applyFilters, applyFieldFilter, joinLinkedRelationships } = require('./helpers/query');
const getIncludedResources = require('./helpers/includes');
const { handleQueryError } = require('./helpers/errors');
const { recordsToCollection, recordToResource, resourceToRecord } = require('./helpers/result-types');
const { validateResources } = require('./helpers/validation');
const formatQuery = require('./helpers/format-query');
const debug = require('debug')('resapi:pg');
const validateModels = require('./helpers/validate-models');

const {
  Collection,
  Error: APIError
} = require('resapi').types;

module.exports = class PostgresAdapter {
  constructor(models, knex) {
    validateModels(models);
    assert(knex, 'A connected knex client is required.');

    this.models = models;
    this.knex = knex;
  }

  /**
   * @param  {String}          type         The name of the type of resource.
   * @param  {String|[String]} [idOrIds]    The resource IDs to form the basis of the search. If null, all resources
   *                                        should be included by default.
   * @param  {[String]|Object} fields       The names of the fields to be included. If empty, include all fields.
   *                                        If an array, applies only to primary resouces. If an object, each key in the
   *                                        object is a type, and each value is an array of fields to include for that
   *                                        type.
   * @param  {[String]}        sorts        The names of the fields by which to sort. Should be treated as ascending,
   *                                        unless the field name is prefixed with a hypen.
   * @param  {Object|Array}    filters      A set of MongoDB (sigh) filters.
   * @param  {[String]}        includePaths Paths to fields to be included as secondary resources. Each path should be
   *                                        a period-separated list of relationship keys. Intermediate resources should
   *                                        be included.
   * @return {Promise}                      Resolves to an array containing to two items:
   *                                           - `primary` for the primary resource or collection of resources.
   *                                           - `included` for the secondary resources included with the `includePaths`
   *                                             option. This should be a single array, not separated by resource type
   *                                             or the key through which the resource was included.
   */
  async find(type, idOrIds, fields, sorts, filters, includePaths) {
    const model = this.models[type];
    const primaryFields = fields != null && fields[type] != null ? fields[type] : [];
    let query = this.knex.from(model.table);
    const singular = idOrIds && !Array.isArray(idOrIds);
    let included = new Collection([]);

    if (singular) {
      query = query.where(model.idKey, idOrIds);
    } else if (idOrIds) {
      query = query.whereIn(model.idKey, idOrIds);
    }

    if (!singular && filters != null) {
      query = applyFilters(query, model, filters);
    }

    if (includePaths) {
      const visiblePaths = primaryFields.length > 0 ? includePaths.filter(path => primaryFields.includes(path)) : includePaths;
      included = getIncludedResources(this.knex, query.clone(), visiblePaths, this.models, type);
    }

    query = applyFieldFilter(query, model, primaryFields);
    query = joinLinkedRelationships(this.knex, query, model, primaryFields);

    if (Array.isArray(sorts)) {
      query = applySorts(query, sorts, model);
    }

    let records;

    debug('executing query:');
    debug(formatQuery(query));

    try {
      [ records, included ] = await Promise.all([ query, included ]);
    } catch (err) {
      handleQueryError(err);
    }

    if (singular && records.length === 0) {
      throw new APIError(404, undefined, 'Not found');
    }

    const primary = singular
      ? recordToResource(records[0], type, model, primaryFields)
      : recordsToCollection(records, type, model, primaryFields);

    return [ primary, included ];
  }

  /**
   * Returns a Promise that fulfills with the created Resource. The Promise may also reject with an error if creation failed or was
   * unsupported.
   *
   * @param   {String}              parentType           The supertype of the resources. Resources may be this or descendents of this.
   * @param   {Resource|Collection} resourceOrCollection The resource or collection of resources to create.
   * @returns {Promise}                                  A copy of the Collection or Resource with IDs added.
   */
  async create(parentType, resourceOrCollection) {
    return mapResourceTypes(resourceOrCollection, this.knex, this.models, (trx, type, model, rs) => {
      const records = rs.map(r => resourceToRecord(r, model));

      return trx
        .insert(records)
        .into(model.table)
        .returning('*')
        .then(inserted => inserted.map(r => recordToResource(r, type, model)));
    });
  }

  /**
   * Returns a Promise that fulfills with the updated Resource. The Promise may also reject with an error if update failed or was
   * unsupported.
   *
   * @param   {String}              parentType           The supertype of the resources. Resources may be this or descendents of this.
   * @param   {Resource|Collection} resourceOrCollection The resource or collection of resources to create.
   * @returns {Promise}                                  A copy of the Collection or Resource with updates applied.
   */
  async update(parentType, resourceOrCollection) {
    return mapResourceTypes(resourceOrCollection, this.knex, this.models, (trx, type, model, rs) => {
      const promises = rs.map(r => {
        const record = resourceToRecord(r, model);

        // TODO: Batch these updates somehow for efficiency
        return trx(model.table)
          .where(model.idKey, '=', r.id)
          .update(record)
          .returning('*');
      });

      return Promise.all(promises).then(
        records => [].concat(...records).map(record => recordToResource(record, type, model))
      );
    });
  }

  async delete(parentType, idOrIds) {
    if (idOrIds == null) {
      throw new APIError(400, undefined, 'You must specify some resources to delete');
    }

    const model = this.models[parentType];
    const single = !Array.isArray(idOrIds);

    const numDeleted = await this.knex
      .from(model.table)
      .whereIn(model.idKey, single ? [ idOrIds ] : idOrIds)
      .delete();

    if (single && numDeleted === 0) {
      throw new APIError(404, undefined, 'No matching resource found');
    }
  }

  addToRelationship(type, id, relationshipPath, newLinkage) {
    throw new Error('Not implemented');
  }

  removeFromRelationship(type, id, relationshipPath, linkageToRemove) {
    throw new Error('Not implemented');
  }

  getModel(modelName) {
    // TODO: Catch undefined
    return this.models[modelName];
  }

  getTypesAllowedInCollection(parentType) {
    // TODO: Support extended tables
    return [ parentType ];
  }

  getRelationshipNames(type) {
    return this.models[type].relationships.map(r => r.key);
  }

  static getModelName(type) {
    return type;
  }
};

async function mapResourceTypes(resourceOrCollection, knex, models, fn) {
  const resources = resourceOrCollection instanceof Collection
    ? resourceOrCollection.resources
    : [ resourceOrCollection ];

  validateResources(resources, models);

  const byType = groupBy(resources, r => r.type);

  const results = await knex.transaction(trx => {
    const promises = Object.keys(byType).map(type => fn(trx, type, models[type], byType[type]));
    return Promise.all(promises).then(rs => [].concat(...rs));
  });

  return resourceOrCollection instanceof Collection
    ? new Collection(results)
    : results[0];
}
