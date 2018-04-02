/// <reference types="knex" />
import { Data, Resource } from "json-api";
import * as Knex from 'knex';
import { StrictModels, StrictModel } from "../models/model-interface";
export default function withResourcesOfEachType<T extends Resource, U extends Resource>(resourceData: Data<T>, knex: Knex, models: StrictModels, callback: (trx: Knex.Transaction, type: string, model: StrictModel, resourcesForType: T[]) => Promise<U[]>): Promise<U[]>;
