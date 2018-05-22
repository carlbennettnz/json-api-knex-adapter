/// <reference types="knex" />
import { QueryBuilder } from 'knex';
import { StrictModels } from '../models/model-interface';
import { ReturnedResource } from 'json-api/build/src/db-adapters/AdapterInterface';
export default function getIncludedResources(query: QueryBuilder, paths: string[], models: StrictModels, primaryType: string): Promise<ReturnedResource[]>;
