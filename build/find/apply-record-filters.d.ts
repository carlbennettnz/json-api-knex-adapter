/// <reference types="knex" />
import { QueryBuilder } from 'knex';
import { Predicate } from 'json-api/build/src/types';
import { StrictModel } from '../models/model-interface';
export default function applyRecordFilters(query: QueryBuilder, model: StrictModel, predicate: Predicate): void;
