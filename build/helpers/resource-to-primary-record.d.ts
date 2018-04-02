import { Resource } from "json-api";
import { StrictModel } from "../models/model-interface";
export default function resourceToPrimaryRecord(resource: Resource, model: StrictModel, {stringifyObjects}?: {
    stringifyObjects?: boolean;
}): object;
