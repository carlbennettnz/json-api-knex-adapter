/// <reference types="knex" />
import { QueryBuilder } from "knex";
import { StrictModel } from "../models/model-interface";
import { FindQuery } from "json-api";
export default function applySorts(query: QueryBuilder, model: StrictModel, sorts: FindQuery['sort']): void;
