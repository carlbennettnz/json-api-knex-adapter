import { Resource } from "json-api";
import { StrictModel, ToManyRelationship } from "../models/model-interface";
import { Transaction } from "knex";
import resourcesToRelRecords from "../helpers/resources-to-rel-records";

export default async function replaceManyToManyRels(
  resources: (Resource & { id: string })[],
  model: StrictModel,
  trx: Transaction
) {
  const relRecords = resourcesToRelRecords(resources, model);

  return await Promise.all(
    Object.keys(relRecords).map(async key => {
      const recordsForRel = relRecords[key];
      const rel = model.relationships.find(rel => rel.key === key) as ToManyRelationship;
      
      // A resource without the relationship key => don't replace
      // A resource with an empty array for representing the relationship => replace
      const resourceIds = resources
        .filter(res => key in res.relationships)
        .map(res => res.id);

      // Clear out the old
      await trx(rel.via.table)
        .delete()
        .where(rel.via.fk, 'in', resourceIds);
      
      // Insert the new
      await trx(rel.via.table)
        .insert(recordsForRel);
    })
  );
}
