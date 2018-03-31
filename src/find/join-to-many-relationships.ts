import { StrictModel, RelType } from "../models/model-interface";
import { QueryBuilder } from "knex";
import { getKnexFromQuery } from "../helpers/knex";

/**
 * Applies appropriate joins to include ids for to-many relationships, and selects the ids as
 * text[] fields.
 *
 * @param  {Query}    query  Knex QueryBuilder instance.
 * @param  {Object}   model  Model for type.
 * @param  {[String]} fields Fields to include for primary resource type, or an empty array if all fields should be included.
 * @return {Query}           Updated query.
 */
export default function joinToManyRelationships(
  query: QueryBuilder,
  model: StrictModel,
  fields: string[]
): void {
  const knex = getKnexFromQuery(query);

  // Get requested to-many rels, or all to-many rels if no constraints are provided
  const linkedRels = model.relationships.filter(
    rel => rel.relType !== RelType.MANY_TO_ONE
      && (fields.length === 0 || fields.includes(rel.key))
  );

  for (const rel of linkedRels) {
    const { table, pk, fk } = rel.via as { table: string, pk: string, fk: string };
    
    query
    .select(knex.raw(`array_agg(distinct "${table}"."${pk}"::text) as "${rel.key}"`))
    .leftJoin(
      table,
      `${model.table}.${model.idKey}`,
      `${table}.${fk}`
    );
  }
  
  if (linkedRels.length > 0) {
    query.groupBy(`${model.table}.${model.idKey}`);
  }
};
