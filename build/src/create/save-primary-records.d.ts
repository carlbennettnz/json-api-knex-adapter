/// <reference types="knex" />
import { Resource } from "json-api";
import { StrictModel } from "../models/model-interface";
import { Transaction } from "knex";
import { ResourceWithId } from "json-api/build/src/types/Resource";
export default function savePrimaryRecords(resources: Resource[], model: StrictModel, trx: Transaction): Promise<{
    primaryRecords: object[];
    resourcesWithIds: ResourceWithId[];
}>;
