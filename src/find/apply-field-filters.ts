import { StrictModel } from "../models/model-interface";
import { QueryBuilder } from "knex";

/**
 * Applies field filters, ensuring the id column is always included.
 *
 * @param  {QueryBuilder} query  Knex query.
 * @param  {Model}        model  Model for primary resource type.
 * @param  {[String]}     fields List of field names to include, or empty for all fields.
 * @return {QueryBuilder}        Query filtered to the requested fields, or all fields for the primary table if fields is empty.
 */
export default function applyFieldFilters(
  query: QueryBuilder,
  model: StrictModel,
  fields: string[]
): void {
  if (fields.length === 0) {
    query.select(`${model.table}.*`);
    return;
  }

  if (!fields.includes(model.idKey)) {
    fields.push(model.idKey);
  }

  query.select(fields);
};
