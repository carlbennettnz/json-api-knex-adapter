import { Resource } from "json-api";
import { StrictModel, ToManyRelationship, RelType } from "../models/model-interface";
import * as assert from 'assert';

/**
 * Returns many-to-many relationship records, keyed by the name of the key in the model.
 */
export default function resourcesToRelRecords(
  resources: (Resource & { id: string })[],
  model: StrictModel
): { [table: string]: object[] } {
  const links = {};
  const manyToManyRels = model.relationships
    .filter(rel => rel.relType === RelType.MANY_TO_MANY) as ToManyRelationship[];

  for (const resource of resources) {
    for (const rel of manyToManyRels) {
      // An empty array here is distinct from a missing relationship. Empty arrays indicate that the existing relationships should be
      // removed, whereas a missing key indicates that no change should be made.
      if (!resource.relationships[rel.key]) continue;

      // Map the resource's relationship sturcture to an array of values to be inserted into a linking table
      links[rel.key] = (resource.relationships[rel.key]
        .unwrapDataWith(it => it.id) as string[])
        .map(id => ({ [rel.via.pk]: id, [rel.via.fk]: resource.id }));
    }
  }

  return links;
}
