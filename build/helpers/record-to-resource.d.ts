import { StrictModel } from "../models/model-interface";
import { ReturnedResource } from "json-api/build/src/db-adapters/AdapterInterface";
export default function recordToResource(record: any, type: string, model: StrictModel, fields?: string[]): ReturnedResource;
