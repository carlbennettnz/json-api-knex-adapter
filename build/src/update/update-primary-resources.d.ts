/// <reference types="knex" />
import { Resource } from "json-api";
import { StrictModel } from "../models/model-interface";
import { Transaction } from "knex";
export default function updatePrimaryResources(resources: (Resource & {
    id: string;
})[], model: StrictModel, trx: Transaction): Promise<any>;
