/// <reference types="knex" />
import { Resource } from 'json-api';
import { QueryBuilder } from 'knex';
import { StrictModels } from '../models/model-interface';
export default function getIncludedResources(query: QueryBuilder, paths: string[], models: StrictModels, primaryType: string): Promise<Resource[]>;
