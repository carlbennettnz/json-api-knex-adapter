const realKnex = require('knex');
const groupBy = require('lodash.groupby');
const zipWith = require('lodash.zipwith');
const { applySorts, applyFilters } = require('./helpers/query');
const { handleQueryError } = require('./helpers/errors');
const { recordsToCollection, recordToResource, resourceToRecord } = require('./helpers/result-types');
const { validateResources } = require('./helpers/validation');

const {
  Error: APIError,
  Collection,
  Resource
} = require('resapi').types;

module.exports = class PostgresAdapter {
  constructor(models, knex = realKnex) {
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
    let query = this.knex.from(this.models[type].table);

    if (Array.isArray(idOrIds)) {
      query = query.whereIn(model.idKey, idOrIds);
    } else if (typeof idOrIds === 'string') {
      query = query.where(model.idKey, idOrIds);
    }

    // ?fields[posts]=a,b,c
    if (fields != null && Array.isArray(fields[type])) {
      const f = [ ...fields[type] ];

      if (!f.includes(model.idKey)) {
        f.push(model.idKey);
      }

      query = query.select(f);
    } else {
      fields = { [type]: [] }
    }

    if (Array.isArray(sorts)) {
      query = applySorts(query, sorts, model);
    }

    if (filters != null && typeof filters === 'object' && !Array.isArray(filters)) {
      query = applyFilters(query, filters);
    }

    if (includePaths) {
      throw new Error('Not implemented');
    }

    let records;

    try {
      records = await query;
    } catch (err) {
      handleDatabaseError(err);
    }

    const primary = !idOrIds || Array.isArray(idOrIds)
      ? recordsToCollection(records, type, model, fields[type])
      : recordToResource(records[0], type, model, fields[type]);

    const included = new Collection([]);

    return [ primary, included ];
  }

  /**
   * Returns a Promise that fulfills with the created Resource. The Promise may also reject with an error if creation failed or was
   * unsupported.
   *
   * @param {String}              parentType           The supertype of the resources. Resources may be this or descendents of this.
   * @param {Resource|Collection} resourceOrCollection The resource or collection of resources to create.
   */
  async create(parentType, resourceOrCollection) {
    return mapResourceTypes(resourceOrCollection, this.knex, this.models, (trx, type, model, rs) => {
      return trx
        .insert(rs)
        .into(model.table)
        .returning('id')
        .then(ids => zipWith(ids, rs, (id, r) => new Resource(r.type, id.toString(), r.attrs, r.relationships)))
    });
  }

      });

    });
  }

  delete(parentType, idsOrIds) {
    throw new Error('Not implemented');
  }

  addToRelationship(type, id, relationshipPath, newLinkage) {
    throw new Error('Not implemented');
  }

  removeFromRelationship(type, id, relationshipPath, linkageToRemove) {
    throw new Error('Not implemented');
  }

  getModel(modelName) {
    throw new Error('Not implemented');
  }

  getTypesAllowedInCollection(parentType) {
    throw new Error('Not implemented');
  }

  getRelationshipNames(type) {
    throw new Error('Not implemented');
  }

  static getModelName(type) {
    throw new Error('Not implemented');
  }
}

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
