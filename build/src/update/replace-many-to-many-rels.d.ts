/// <reference types="knex" />
import { Resource } from "json-api";
import { StrictModel } from "../models/model-interface";
import { Transaction } from "knex";
export default function replaceManyToManyRels(resources: (Resource & {
    id: string;
})[], model: StrictModel, trx: Transaction): Promise<void[]>;
