/// <reference types="knex" />
import { QueryBuilder } from 'knex';
import { FieldExpression } from 'json-api/build/src/types';
import { StrictModel } from '../models/model-interface';
export declare type Predicate = {
    operator: 'and' | 'or';
    args: FieldExpression[];
};
export default function applyRecordFilters(query: QueryBuilder, model: StrictModel, expr: Predicate): void;
export declare const SUPPORTED_OPERATORS: string[];
