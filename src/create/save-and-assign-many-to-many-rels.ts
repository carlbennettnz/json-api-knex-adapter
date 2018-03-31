import { StrictModel, ToManyRelationship } from "../models/model-interface";
import { Transaction } from "knex";
import { flatten } from "lodash-es";
import resourcesToRelRecords from '../helpers/resources-to-rel-records';
import { ResourceWithId } from "json-api/build/src/types/Resource";

export default async function saveAndAssignManyToManyRels(
  resources: ResourceWithId[],
  primaryRecords: object[],
  model: StrictModel,
  trx: Transaction
): Promise<void> {
  const relRecords = resourcesToRelRecords(resources, model);

  const savedRelRecords = await Promise.all(
    Object.keys(relRecords).map(key => {
      const rel = model.relationships.find(rel => rel.key === key) as ToManyRelationship;

      return trx
        .insert(relRecords[key])
        .into(rel.via.table)
        .returning('*')
        .then(inserted => inserted.map(record => ({ rel, record })));
    })
  ).then(flatten);

  for (const { rel, record: relRecord } of savedRelRecords) {
    const primary = primaryRecords.find(primary => primary[model.idKey] === relRecord[rel.via.fk]) as any;

    if (!primary[rel.key]) {
      primary[rel.key] = [];
    }

    primary[rel.key].push(relRecord[rel.via.pk]);
  }
}
