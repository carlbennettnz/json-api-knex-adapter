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
    resources.map(async resource => {
      const record = resourceToPrimaryRecord(resource, model);

      // Possible if the only values changed are to-many relationships
      if (Object.keys(record).length === 0) {
        return 0
      }
      
      return trx(model.table)
        .where(model.idKey, resource.id)
        .update(record)
    })
  );
}
