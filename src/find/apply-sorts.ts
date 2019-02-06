import { QueryBuilder } from "knex";
import { StrictModels, RelType, StrictModel } from "../models/model-interface";
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

  // Cast to FieldSort[] is checked by validateSorts()
  const relationshipSortFields = [] as string[];
  for (const { field, direction } of sorts as FieldSort[]) {
    if(!getValidKeys(models[primaryType]).includes(field)){
      // must be field of relationship
      relationshipSortFields.push(field); // track relationship sorts for joining
      applyRelationshipSort(
        query,
        models,
        primaryType,
        field,
        direction.toLowerCase()
      );
    } else {
      const key = field === 'id' ? models[primaryType].idKey : field;
      query.orderBy(`${models[primaryType].table}.${key}`, direction.toLowerCase());
    };
    
  }
  joinRequiredRelationshipsForSorts (query, models, primaryType, relationshipSortFields)
};

function getRelationshipTypeFromKey(model : StrictModel, key: string){
  const relationship = model.relationships.find( relationship => relationship.key === key);
   if(!relationship){
    throw new APIError({
      status: 400,
      title: 'Invalid sort',
      detail: `The relationship '${key}' does not exist on this model.'`
    });
  }
  return relationship.type
}

function getValidKeys(model : StrictModel){
  return [
    'id',
    ...model.attrs.map(attr => attr.key),
    ...model.relationships
      .filter(rel => rel.relType === RelType.MANY_TO_ONE)
      .map(rel => rel.key)
  ];
}

function applyRelationshipSort(
  query: QueryBuilder,
  models: StrictModels,
  primaryType: string,
  field: string,
  direction: string
) {
  const relationshipKey = field.substring(0, field.indexOf("."));
  const relationshipAttribute = field.substring(field.indexOf(".") + 1);
  const relationshipType = getRelationshipTypeFromKey(
    models[primaryType],
    relationshipKey
  );
  const relationshipTable = `${models[relationshipType].table}`;
  query.groupBy(`${relationshipTable}.${relationshipAttribute}`);
  query.orderBy(`${relationshipTable}.${relationshipAttribute}`);
}

function joinRequiredRelationshipsForSorts(
  query: QueryBuilder,
  models: StrictModels,
  primaryType: string,
  sortFields: string[]
){  
  // join relationships that are referenced by sorts
  const relationshipKeys = [...new Set(sortFields.map(field => field.substring(0,field.indexOf('.'))))]
  relationshipKeys.forEach( relationshipKey => {
    const relationshipType = getRelationshipTypeFromKey(models[primaryType], relationshipKey);
    const relationshipTable = `${models[relationshipType].table}`;
    const localFK = `${models[primaryType].table}.${relationshipKey}`;
    const foreignPK = `${models[relationshipType].table}.${models[relationshipType].idKey}`;
    query.leftJoin(relationshipTable, localFK, foreignPK);
  });
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
  const validKeys = getValidKeys(models[primaryType]);
  const invalidSorts = sorts.filter( sort => {
    
    if(!('field' in sort)){
      return true;
    } else if(!validKeys.includes(sort.field)){
      
      // not direct field match, check for relationship match
      const relationshipKey = sort.field.substring(0,sort.field.indexOf('.'));
      const relationshipField = sort.field.substring(sort.field.indexOf('.')+1);
      // check if valid keys contains relationship name, 
      if (!validKeys.includes(relationshipKey)){
        return true
      }
      
      // validate relationship field
      const relationshipType = getRelationshipTypeFromKey(models[primaryType], relationshipKey);
      let validRelationshipKeys;
      if(relationshipType){
        validRelationshipKeys = getValidKeys(models[relationshipType]);
      }
      
      return !validRelationshipKeys.includes(relationshipField)
    } else {
      return false;
    }
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
