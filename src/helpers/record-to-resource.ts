import {
  Relationship,
  Resource,
  Data,
  ResourceIdentifier
} from "json-api";

import {
  StrictModel,
  RelType
} from "../models/model-interface";

import { ReturnedResource } from "json-api/build/src/db-adapters/AdapterInterface";

export default function recordToResource(
  record: any,
  type: string,
  model: StrictModel,
  fields: string[] = []
): ReturnedResource {
  const id = String(record[model.idKey]);
  const attrs = {};
  const relationships = {};

  // Extract attributes
  for (const { key, deserialize } of model.attrs) {
    if (record[key] == null) continue;

    attrs[key] = deserialize(record[key]);
  }

  // Extract relationships
  for (const rel of model.relationships) {
    // TODO: this may be redundant
    const fieldAllowed = fields.length === 0 || fields.includes(rel.key);

    if (!fieldAllowed || record[rel.key] == null) continue;

    const linkage = rel.relType === RelType.MANY_TO_ONE
      ? getToOneLinkage(type, record[rel.key])
      : getToManyLinkage(type, record[rel.key]);

    relationships[rel.key] = Relationship.of({
      data: linkage,
      owner: { type, id, path: rel.key }
    });
  }

  const resource = new Resource(type, id, attrs, relationships);
  
  // TODO: This, but properly
  resource.typePath = [ type ];

  return resource as ReturnedResource; // Resource has id and typePath
}

function getToOneLinkage(type: string, id: any): Data<ResourceIdentifier> {
  return Data.pure<ResourceIdentifier>(
    new ResourceIdentifier(type, String(id))
  );
}

function getToManyLinkage(type: string, ids: any[]): Data<ResourceIdentifier> {
  return Data.of(
    ids
      .filter(id => id !== null)
      .map(id => new ResourceIdentifier(
        type,
        String(id)
      ))
  );
}
