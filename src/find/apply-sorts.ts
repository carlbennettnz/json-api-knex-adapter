import { QueryBuilder } from "knex";
import { StrictModel, RelType } from "../models/model-interface";
import { Error as APIError, FindQuery, Sort, FieldSort } from "json-api";

/**
 * Applies sorts to the query. Throw APIErrors if fields to sort by are not 'id', attributes, or
 * to-one relationships on the model.
 */
export default function applySorts(
  query: QueryBuilder,
  model: StrictModel,
  sorts: FindQuery['sort']
): void {
  if (sorts == null) return;

  validateSorts(model, sorts);

  // Cast to FieldSort[] is checked by validateSorts()
  for (const { field, direction } of sorts as FieldSort[]) {
    const key = field === 'id' ? model.idKey : field;
    query.orderBy(`${model.table}.${key}`, direction.toLowerCase());
  }
};

/**
 * Catch sorts of keys not in the model. Important for security as this prevents sorting by hidden,
 * private attributes, potentially resulting in data leakage.
 */
function validateSorts(
  model: StrictModel,
  sorts: Sort[]
): void {
  const validKeys = [
    'id',
    ...model.attrs.map(attr => attr.key),
    ...model.relationships
      .filter(rel => rel.relType === RelType.MANY_TO_ONE)
      .map(rel => rel.key)
  ]
  
  const invalidSorts = sorts.filter(
    sort => !('field' in sort) || !validKeys.includes(sort.field)
  );

  if (invalidSorts.length > 0) {
    throw invalidSorts.map(sort => new APIError({
      status: 400,
      title: 'Invalid sort',
      detail: `The attribute '${'field' in sort ? sort.field : JSON.stringify(sort)}'`
        + `does not exist as an attribute or relationship on this model.'`
    }));
  }
}
