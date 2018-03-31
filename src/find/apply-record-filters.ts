import { QueryBuilder } from 'knex';
import { Error as APIError } from 'json-api';
import { FieldConstraint, Predicate } from 'json-api/build/src/types';

import { StrictModel, RelType } from '../models/model-interface';

/**
 * Applies a Predicate to a Knex QueryBuilder
 */
export default function applyRecordFilters(query: QueryBuilder, model: StrictModel, predicate: Predicate) {
  for (const predicateOrConstraint of predicate.value) {
    const isPredicate = ['and', 'or'].includes(predicateOrConstraint.operator);
    
    if (isPredicate) {
      // e.g. { $and: [{x: 1}, {y: 2}] }
      const whereVariant = getWhereVariant(predicate.operator);

      query[whereVariant](function(this: QueryBuilder) {
        applyFilters(this, model, predicateOrConstraint as Predicate);
      });
    } else {
      // e.g. {x: 1}
      applyFieldConstraint(
        query,
        model,
        predicateOrConstraint as FieldConstraint,
        predicate.operator
      );
    }
  }
}

function getWhereVariant(operator: 'and' | 'or') {
  return operator === 'and'
    ? 'andWhere'
    : 'orWhere';
}

const OPERATORS = {
  eq: '=',
  ne: '!=',
  neq: '!=',
  in: 'in',
  nin: 'not in',
  lt: '<',
  gt: '>',
  lte: '<=',
  gte: '>='
};

/**
 * Applies the given constraint to the query. Throws an APIError if the field does not exist on the
 * model, or if the operator is invalid.
 */
function applyFieldConstraint(
  query: QueryBuilder,
  model: StrictModel,
  { field, value, operator }: FieldConstraint,
  logicalContext: 'and' | 'or'
): void {
  const qualifiedKey = getQualifiedKey(field, model);

  if (qualifiedKey === null) {
    throw new APIError(400, undefined, 'Bad filter', `Path ${field} does not exist.`);
  }
  
  if (!(op in OPERATORS)) {
    throw new APIError(400, undefined, 'Bad filter', `Unknown operator ${op}.`);
  }

  const whereVariant = getWhereVariant(logicalContext);

  query[whereVariant](field, OPERATORS[operator], value);
}

/**
 * Returns the table-qualified key name, or null if no matching property is found on the model.
 */
function getQualifiedKey(key: string, model: StrictModel): string | null {
  if (key === 'id') {
    return `${model.table}.${model.idKey}`;
  }

  if (model.attrs.some(attr => attr.key === key)) {
    return `${model.table}.${key}`;
  }
  
  const rel = model.relationships.find(r => r.key === key);

  if (rel == null) {
    return null;
  }

  return rel.relType === RelType.MANY_TO_MANY && rel.via
    ? `${rel.via.table}.${rel.via.pk}`
    : `${model.table}.${key}`;
}
