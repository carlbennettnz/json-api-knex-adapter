const { Error: APIError, Collection } = require('resapi').types;
const _groupBy = require('lodash.groupby');
const debug = require('debug')('resapi:pg');
const formatQuery = require('./format-query');
const { recordToResource } = require('./result-types');

/**
 * Loads the resources to be included in the request, based on the included paths.
 *
 * This implementation makes a query for each relatied resource type to be included, and one subquery for each relationship. The queries
 * produced look something like these:
 *
 *     select *
 *     from "author"
 *     where _id in (
 *       select distinct "_id"
 *       from "post"
 *       where "post"."title" = "Post 1")
 *
 *     select * from "tags"
 *     where _id in (
 *       select distinct "post_tag"."tag"
 *       from "post"
 *       left join "post_tag" on "post_tag"."post" = "post"."_id"
 *       where "post"."_id" = 1)
 *
 * The where clauses in the subqueries are always the same as in the primary resource query and should have already been applied to the
 * query passed into this function. The passed query is not mutated.
 *
 * There are a few different ways this could be implemented, including some that may perform better than this implementation.
 *
 * Firstly, if only a single relationship of a given type is being included, the query could be inverted, giving something more like this:
 *
 *     select distinct on("author"."_id") "author".*
 *     from "post"
 *     right join "author" on "author"."_id" = "post"."author"
 *     where "post"."title" = "Post 1"
 *
 * This trades adds a join, but removes a subquery. Is that better? No idea, but if you're having performance problems, it might be worth
 * trying.
 *
 * @param  {Knex}                knex        Knex instance.
 * @param  {QueryBuilder}        query       Knex query with the where clauses (but not select or order by clauses) for the primary request
 *                                           applied. Will not be mutated by this function.
 * @param  {[String]}            paths       List of relationship key names to apply.
 * @param  {[Model]}             models      All models.
 * @param  {String}              primaryType The type of the primary resources.
 * @return {Promise<Collection>}             The collection of resources to be included.
 */
async function getIncludedResources(knex, query, paths, models, primaryType) {
  const model = models[primaryType];
  const rels = model.relationships;

  validatePaths(paths, rels);

  // One query will be made for each type, not each relationship
  const relsToInclude = paths.map(path => rels.find(rel => rel.key === path));
  const relsByType = _groupBy(relsToInclude, 'type');

  const queries = [];

  for (const type in relsByType) {
    const {
      direct = [],
      linked = []
    } = _groupBy(relsByType[type], rel => rel.via == null ? 'direct' : 'linked');

    const subqueries = [
      ...direct.map(rel => query.clone().distinct(rel.key)),
      ...linked.map(rel => getSubqueryForLinkedRel(knex, query, model, rel))
    ];

    const includeQuery = getQueryForType(knex, models[type], subqueries);

    debug('executing query for included resources:');
    debug(formatQuery(includeQuery));

    queries.push(includeQuery.then(result => [ type, result ]));
  }

  const resources = await Promise.all(queries).then(results => {
    return results.reduce((prev, [ type, result ]) =>
      prev.concat(
        result.map(record => recordToResource(record, type, models[type]))
      ), []);
  });

  return new Collection(resources);
}

/**
 * Checks that each path is actually a relationship on the priamry resource's model.
 *
 * @param  {[String]} paths Relationship paths to check.
 * @param  {[Object]} rels  The relationships for the primary resource type.
 * @return {void}
 * @throws {[APIError]} If invalid paths are found.
 */
function validatePaths(paths, rels) {
  const pathErrors = paths
    .filter(path => !rels.some(rel => rel.key === path))
    .map(badPath => new APIError(400, undefined, 'Bad include', `Included path '${badPath}' is not a relationship on this model.`));

  if (pathErrors.length > 0) {
    throw pathErrors;
  }
}

/**
 * Gets a query returning a single column of ids at the other end of a linked relationship.
 *
 * @param  {Knex}         knex  Knex instance.
 * @param  {QueryBuilder} query Knex query with where clauses already applied.
 * @param  {Model}        model Model of the primary resource.
 * @param  {Object}       rel   Relationship to load.
 * @return {QueryBuilder}       Knex query returning the ids of the related resources.
 */
function getSubqueryForLinkedRel(knex, query, model, rel) {
  const foreignAttr = `"${rel.via.table}"."${rel.via.showing || rel.via.aggregating}"`;
  const localPrimaryKey = `${model.table}.${model.idKey}`;
  const foreignKey = `${rel.via.table}.${rel.via.on}`;

  return query.clone()
    .distinct(knex.raw(`${foreignAttr} as "${rel.key}"`))
    .leftJoin(rel.via.table, localPrimaryKey, foreignKey);
}

/**
 * Builds a query for the resource to be included using a list of subqueries to constrain the results. The subqueries should each return a
 * single column of ids to be compared to the potentially-included resources' ids.
 *
 * @param  {Knex}           knex          Knex instance.
 * @param  {String}         options.table The name of the table from which the resources should be loaded.
 * @param  {String}         options.idKey The name of the value that must be contained in at least one of the subqueries.
 * @param  {[QueryBuilder]} subqueries    List of Knex queries, each returning a single column of ids. Resources will only be included if
 *                                        their id is found in at least one subquery.
 * @return {QueryBuilder}                 Knex query returning the resources to be included.
 */
function getQueryForType(knex, { table, idKey }, subqueries) {
  let includeQuery = knex(table);

  for (const subquery of subqueries) {
    includeQuery = includeQuery.orWhereIn(idKey, subquery);
  }

  return includeQuery;
}

module.exports = getIncludedResources;
