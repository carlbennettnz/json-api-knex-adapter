import { Resource } from "json-api";
import resourceToPrimaryRecord from "../helpers/resource-to-primary-record";
import { StrictModel } from "../models/model-interface";
import { Transaction } from "knex";
import { ResourceWithId } from "json-api/build/src/types/Resource";

export default async function savePrimaryRecords(
  resources: Resource[],
  model: StrictModel,
  trx: Transaction
): Promise<{ primaryRecords: object[], resourcesWithIds: ResourceWithId[] }> {
  const records = resources
    .map(res => resourceToPrimaryRecord(res, model));

  const primaryRecords: object[] = await trx
    .insert(records)
    .into(model.table)
    .returning('*');

  // Assign IDs to the resources
  resources.forEach((resource, i) => {
    resource.id = primaryRecords[i][model.idKey];
  });

  return {
    primaryRecords,
    resourcesWithIds: resources as ResourceWithId[]
  };
}