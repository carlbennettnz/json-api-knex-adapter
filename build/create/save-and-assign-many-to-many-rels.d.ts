/// <reference types="knex" />
import { StrictModel } from "../models/model-interface";
import { Transaction } from "knex";
import { ResourceWithId } from "json-api/build/src/types/Resource";
export default function saveAndAssignManyToManyRels(resources: ResourceWithId[], primaryRecords: object[], model: StrictModel, trx: Transaction): Promise<void>;
