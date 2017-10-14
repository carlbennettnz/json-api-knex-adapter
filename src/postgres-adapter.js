const realKnex = require('knex');
const groupBy = require('lodash.groupby');
const zipWith = require('lodash.zipwith');
const { applySorts, applyFilters } = require('./helpers/query');
const { handleQueryError } = require('./helpers/errors');
const { recordsToCollection, recordToResource } = require('./helpers/result-types');
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
      query = query.whereIn('id', idOrIds);
    } else if (typeof idOrIds === 'string') {
      query = query.where('id', idOrIds);
    }

    // ?fields=a,b,c
    if (Array.isArray(fields) && fields.length > 0) {
      query = query.select(fields);
    }

    // ?fields[post]=a,b,c
    if (fields != null && fields[type]) {
      query = query.select(fields[type]);
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
      ? recordsToCollection(records, type, this.models)
      : recordToResource(records[0], type, this.models);

    const included = recordsToCollection([]);

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
    const resources = resourceOrCollection instanceof Collection
      ? resourceOrCollection.resources
      : [ resourceOrCollection ];

    validateResources(resources, this.models);

    const resourcesByType = groupBy(resources, r => r.type);

    const results = await this.knex.transaction(trx => {
      const promises = Object.keys(resourcesByType).map(type => {
        const rs = resourcesByType[type];
        const model = this.models[type]; // TODO: catch bad type

        return trx
          .insert(rs)
          .into(model.table)
          .returning('id')
          .then(ids => zipWith(ids, rs, (id, r) => new Resource(r.type, id.toString(), r.attrs, r.relationships)))
      });

      return Promise.all(promises);
    });

    return resourceOrCollection instanceof Collection
      ? new Collection(results)
      : results[0];
  }

  update(parentType, resourceOrCollection) {
    throw new Error('Not implemented');
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
