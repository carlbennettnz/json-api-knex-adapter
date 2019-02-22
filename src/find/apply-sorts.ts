import { QueryBuilder } from "knex";
import { StrictModels, RelType, StrictModel, StrictRelationship } from "../models/model-interface";
import { Error as APIError, FindQuery, Sort, FieldSort } from "json-api";

/**
 * Applies sorts to the query. Throw APIErrors if fields to sort by are not 'id', attributes, or
 * to-one relationships on the model.
 */
export default function applySorts(
  query: QueryBuilder,
  models: StrictModels,
  primaryType: string,
  sorts: FindQuery['sort']
): void {
  if (sorts == null) return;

  validateSorts(models, primaryType, sorts);

  const fieldSorts = sorts as FieldSort[]
  const primaryModel = models[primaryType]
  const relsToJoin: StrictRelationship[] = []

  for (const sort of fieldSorts) {
    if (isDeepSort(primaryModel, sort.field)) {
      const rel = applyDeepSort(query, models, primaryType, sort);
      relsToJoin.push(rel);
    } else {
      applyShallowSort(query, sort, primaryModel);
    }
  }

  joinToManyRels(query, models, primaryType, relsToJoin);
}

/**
 * Catch sorts of keys not in the model. Important for security as this prevents sorting by hidden,
 * private attributes, potentially resulting in data leakage.
 */
function validateSorts(
  models: StrictModels,
  primaryType: string,
  sorts: Sort[]
): void {
  const validKeys = getAttrsAndToOneRelKeys(models[primaryType]);

  const invalidSorts = sorts.filter(sort => {
    if (!('field' in sort)) return true;

    const [ parentKey, ...childKeys ] = sort.field.split('.')

    if (!validKeys.includes(parentKey)) return true;
    if (childKeys.length === 0) return false;

    if (childKeys.length > 1) {
      throw new APIError({
        status: 501,
        title: 'Unsupported sort',
        detail: 'Sorts on properties more than one level removed from the primary resource are not supported.'
      })
    }

    const childKey: string = childKeys[0]
    const relationshipType = getRelationship(models[primaryType], parentKey).type;
    const validRelationshipKeys = getAttrsAndToOneRelKeys(models[relationshipType]);

    return !validRelationshipKeys.includes(childKey)
  });

  if (invalidSorts.length > 0) {
    throw invalidSorts.map(sort => new APIError({
      status: 400,
      title: 'Invalid sort',
      detail: `The attribute '${'field' in sort ? sort.field : JSON.stringify(sort)}'`
        + `does not exist as an attribute or relationship on this model.'`
    }));
  }
}

function isDeepSort(model: StrictModel, key: string) {
  return !getAttrsAndToOneRelKeys(model).includes(key)
}

function getAttrsAndToOneRelKeys(model: StrictModel){
  return [
    'id',
    ...model.attrs.map(attr => attr.key),
    ...model.relationships
      .filter(rel => rel.relType === RelType.MANY_TO_ONE)
      .map(rel => rel.key)
  ];
}

function applyShallowSort(query: QueryBuilder, { field, direction }: FieldSort, model: StrictModel) {
  const key = field === 'id' ? model.idKey : field;
  query.orderBy(`${model.table}.${key}`, direction.toLowerCase());
}

function applyDeepSort(
  query: QueryBuilder,
  models: StrictModels,
  primaryType: string,
  { field, direction }: FieldSort
): StrictRelationship {
  const [ parentKey, childKey ] = field.split('.');
  const rel = getRelationship(models[primaryType], parentKey);
  const childCol = `${models[rel.type].table}.${childKey}`;

  query.groupBy(childCol);
  query.orderBy(childCol, direction.toLowerCase());

  return rel
}

function getRelationship(model: StrictModel, key: string) {
  return model.relationships.find(relationship => relationship.key === key)!;
}

function joinToManyRels(
  query: QueryBuilder,
  models: StrictModels,
  primaryType: string,
  rels: StrictRelationship[]
) {
  for (const rel of rels) {
    const relationshipTable = `${models[rel.type].table}`;
    const localFK = `${models[primaryType].table}.${rel.key}`;
    const foreignPK = `${models[rel.type].table}.${models[rel.type].idKey}`;

    query.leftJoin(relationshipTable, localFK, foreignPK);
  }
}
