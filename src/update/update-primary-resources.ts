import { Resource } from "json-api";
import { StrictModel } from "../models/model-interface";
import { Transaction } from "knex";
import resourceToPrimaryRecord from "../helpers/resource-to-primary-record";

export default async function updatePrimaryResources(
  resources: (Resource & { id: string })[],
  model: StrictModel,
  trx: Transaction
): Promise<any> {
  return await Promise.all(
    resources.map(resource => {
      const record = resourceToPrimaryRecord(resource, model);
      
      return trx(model.table)
        .where(model.idKey, resource.id)
        .update(record)
    })
  );
}
