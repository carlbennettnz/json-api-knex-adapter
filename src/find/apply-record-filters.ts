import { QueryBuilder } from 'knex';
import { Error as APIError } from 'json-api';
import { FieldExpression } from 'json-api/build/src/types'

import { StrictModel, RelType } from '../models/model-interface';

export type Predicate = {
  operator: 'and' | 'or',
  args: FieldExpression[]
}

/**
 * Applies a Predicate to a Knex QueryBuilder
 */
export default function applyRecordFilters(query: QueryBuilder, model: StrictModel, expr: Predicate) {
  for (const subExpr of expr.args) {
    const isPredicate = ['and', 'or'].includes(subExpr.operator);
    
    if (isPredicate) {
      // e.g. { $and: [{x: 1}, {y: 2}] }
      const whereVariant = getWhereVariant(expr.operator as 'and' | 'or');

      query[whereVariant](function(this: QueryBuilder) {
        applyRecordFilters(this, model, subExpr as Predicate);
      });
    } else {
      // e.g. {x: 1}
      applyFieldConstraint(
        query,
        model,
        subExpr,
        expr.operator
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

export const SUPPORTED_OPERATORS = Object.keys(OPERATORS);

/**
 * Applies the given constraint to the query. Throws an APIError if the field does not exist on the
 * model, or if the operator is invalid.
 */
function applyFieldConstraint(
  query: QueryBuilder,
  model: StrictModel,
  { operator, args: [ { value: field }, value ] }: FieldExpression,
  logicalContext: 'and' | 'or'
): void {
  const qualifiedKey = getQualifiedKey(field, model);

  if (qualifiedKey === null) {
    throw new APIError({
      status: 400,
      title: 'Bad filter',
      detail: `Path ${field} does not exist.`
    });
  }
  
  if (!(operator in OPERATORS)) {
    throw new APIError({
      status: 400,
      title: 'Bad filter',
      detail: `Unknown operator ${operator}.`
    });
  }

  const whereVariant = getWhereVariant(logicalContext);

  query[whereVariant](qualifiedKey, OPERATORS[operator], value);
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
