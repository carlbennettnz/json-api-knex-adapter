import { Error as APIError } from 'json-api';
import { groupBy } from 'lodash';
import * as debugFactory from 'debug';

import { QueryBuilder } from 'knex';

import { getKnexFromQuery } from '../helpers/knex';
import formatQuery from '../helpers/format-query';
import recordToResource from '../helpers/record-to-resource';
import { StrictModels, StrictRelationship, StrictModel, RelType } from '../models/model-interface';

const debug = debugFactory('resapi:pg')

/**
 * Loads the resources to be included in the request, based on the included paths.
 *
 * This implementation makes a query for each related resource type to be included, and one
 * subquery for each relationship. The queries produced look something like these:
 *
 *     select *
 *     from "author"
 *     where _id in (
 *       select distinct "author"
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
 * The where clauses in the subqueries are always the same as in the primary resource query and
 * should have already been applied to the query passed into this function. The passed query is not
 * mutated.
 *
 * There are a few different ways this could be implemented, including some that may perform better
 * than this implementation.
 *
 * For example, if only a single relationship of a given type is being included, the query could be
 * inverted, giving something more like this:
 *
 *     select distinct on("author"."_id") "author".*
 *     from "post"
 *     right join "author" on "author"."_id" = "post"."author"
 *     where "post"."title" = "Post 1"
 *
 * This trades adds a join, but removes a subquery. Is that better? No idea, but if you're having
 * performance problems, it might be worth trying.
 *
 * @param  {QueryBuilder}        query       Knex query with the where clauses (but not select or
 *                                           order by clauses) for the primary request applied.
 *                                           Will not be mutated by this function.
 * @param  {[String]}            paths       List of relationship key names to apply.
 * @param  {[Model]}             models      All models.
 * @param  {String}              primaryType The type of the primary resources.
 * @return {Promise<Collection>}             The collection of resources to be included.
 */
export default async function getIncludedResources(
  query: QueryBuilder,
  paths: string[],
  models: StrictModels,
  primaryType: string
) {
  const primaryModel = models[primaryType];
  const rels = primaryModel.relationships;

  validatePaths(paths, rels);

  // One query will be made for each type, not each relationship
  const relsToInclude = paths.map(path => rels.find(rel => rel.key === path) as StrictRelationship);
  const relsByType = groupBy(relsToInclude, 'type');

  const queries: Promise<any>[] = [];

  for (const type in relsByType) {
    const {
      direct = [],
      linked = []
    } = groupBy(relsByType[type], rel => rel.via == null ? 'direct' : 'linked');

    const subqueries = [
      ...direct.map(rel => query.clone().distinct(rel.key)),
      ...linked.map(rel => getSubqueryForLinkedRel(query, models[type], rel))
    ];

    const includeQuery = getQueryForType(query, models[type], subqueries);

    debug('executing query for included resources:');
    debug(formatQuery(includeQuery));

    queries.push(Promise.resolve(includeQuery).then(result => [ type, result ]));
  }

  const resources = await Promise.all(queries).then(results => {
    // Concat all results into a single array of resources
    return results.reduce((prev, [ type, result ]) =>
      prev.concat(
        result.map(record => recordToResource(record, type, models[type]))
      ), []);
  });

  return resources;
}

/**
 * Checks that each path is actually a relationship on the priamry resource's model.
 *
 * @param  {[String]} paths Relationship paths to check.
 * @param  {[Object]} rels  The relationships for the primary resource type.
 * @return {void}
 * @throws {[APIError]} If invalid paths are found.
 */
function validatePaths(paths: string[], rels: StrictRelationship[]) {
  const pathErrors = paths
    .filter(path => !rels.some(rel => rel.key === path))
    .map(badPath => new APIError(400, undefined, 'Bad include', `Included path '${badPath}' is not a relationship on this model.`));

  if (pathErrors.length > 0) {
    throw pathErrors;
  }
}

/**
 * Gets a query returning a single column of ids at the other end of a linked relationship. If we're including a set of posts' authors, the
 * final query will end up looking something like this:
 *
 *   SELECT author._id AS author
 *   FROM post
 *   LEFT JOIN author ON author._id = post.author
 *   WHERE post.date > '2017-01-01'
 *
 * This can then be used in the actual authors query to filter the authors by _id, like this:
 *
 *   SELECT *
 *   FROM author
 *   WHERE _id IN <the query returned by this method>
 *
 * @param  {QueryBuilder} query Knex query with where clauses already applied.
 * @param  {Model}        model Model of the primary resource.
 * @param  {Object}       rel   Relationship to load.
 * @return {QueryBuilder}       Knex query returning the ids of the related resources.
 */
function getSubqueryForLinkedRel(query, model, rel) {
  const foreignPK = `"${rel.via.table}"."${rel.via.pk}"`;
  const localPK = `${model.table}.${model.idKey}`;
  const foreignFK = `${rel.via.table}.${rel.via.fk}`;

  return query.clone()
    .distinct(getKnexFromQuery(query).raw(`${foreignPK} as "${rel.key}"`))
    .leftJoin(rel.via.table, localPK, foreignFK);
}

/**
 * Builds a query for the resource to be included using a list of subqueries to constrain the results. The subqueries should each return a
 * single column of ids to be compared to the potentially-included resources' ids.
 *
 * @param  {QueryBuilder}   query         Knex query.
 * @param  {String}         options.table The name of the table from which the resources should be loaded.
 * @param  {String}         options.idKey The name of the value that must be contained in at least one of the subqueries.
 * @param  {QueryBuilder[]} subqueries    List of Knex queries, each returning a single column of ids. Resources will only be included if
 *                                        their id is found in at least one subquery.
 * @return {QueryBuilder}                 Knex query returning the resources to be included.
 */
function getQueryForType(
  query: QueryBuilder,
  { table, idKey }: StrictModel,
  subqueries: QueryBuilder[]
): QueryBuilder {
  let includeQuery = getKnexFromQuery(query)(table);

  for (const subquery of subqueries) {
    includeQuery = includeQuery.orWhereIn(idKey, subquery);
  }

  return includeQuery;
}
