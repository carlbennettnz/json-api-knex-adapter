/// <reference types="knex" />
import { StrictModel } from "../models/model-interface";
import { QueryBuilder } from "knex";
export default function applyFieldFilters(query: QueryBuilder, model: StrictModel, fields: string[]): void;
