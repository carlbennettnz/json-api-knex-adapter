import { Resource } from "json-api";
import { StrictModel } from "../models/model-interface";
export default function recordToResource(record: any, type: string, model: StrictModel, fields?: string[]): Resource;
