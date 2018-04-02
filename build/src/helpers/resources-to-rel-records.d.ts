import { Resource } from "json-api";
import { StrictModel } from "../models/model-interface";
export default function resourcesToRelRecords(resources: (Resource & {
    id: string;
})[], model: StrictModel): {
    [table: string]: object[];
};
