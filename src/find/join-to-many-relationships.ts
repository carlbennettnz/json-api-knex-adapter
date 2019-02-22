import { StrictModel, RelType } from "../models/model-interface";
import { QueryBuilder } from "knex";
import { getKnexFromQuery } from "../helpers/knex";

/**
 * Applies appropriate joins to include ids for to-many relationships.
 *
 * @param  {Query}    query  Knex QueryBuilder instance.
 * @param  {Object}   model  Model for type.
 * @param  {[String]} fields Fields to include for primary resource type, or an empty array if all fields should be included.
 * @return {Query}           Updated query.
 */
export function joinToManyRelationships(
  query: QueryBuilder,
  model: StrictModel,
  fields: string[]
): void {
  const rels = getLinkedRels(model, fields)

  for (const { via: { table, fk } } of rels) {
    query.leftJoin(
      table,
      `${model.table}.${model.idKey}`,
      `${table}.${fk}`
    );
  }
};

/**
 * Selects array_agg()s of the IDs in to-many relationships.
 *
 * @param  {Query}    query  Knex QueryBuilder instance.
 * @param  {Object}   model  Model for request type.
 * @param  {[String]} fields Fields to include for primary resource type, or an empty array if all fields should be included.
 * @return {Query}           Updated query.
 */
export function selectToManyRelationships(
  query: QueryBuilder,
  model: StrictModel,
  fields: string[]
): void {
  const knex = getKnexFromQuery(query);
  const rels = getLinkedRels(model, fields);

  for (const { key, via: { table, pk } } of rels) {
    query.select(knex.raw(`array_agg(distinct "${table}"."${pk}"::text) as "${key}"`));
  }

  if (rels.length > 0) {
    query.groupBy(`${model.table}.${model.idKey}`);
  }
};

/**
 * Get requested to-many rels, or all to-many rels if no constraints are provided
 *
 * @param  {Object}   model
 * @param  {[String]} fields
 * @return {[ToManyRelationship]}
 */
function getLinkedRels(model, fields) {
  return model.relationships
    .filter(
      rel => rel.relType !== RelType.MANY_TO_ONE
        && (fields.length === 0 || fields.includes(rel.key))
    );
}
