import { Resource } from "json-api";
import { StrictModel, RelType } from "../models/model-interface";

export default function resourceToPrimaryRecord(
  resource: Resource,
  model: StrictModel,
  { stringifyObjects = true } = {}
): object {
  const record = {};

  for (const attr in resource.attrs) {
    const val = resource.attrs[attr];

    record[attr] = stringifyObjects && val !== null && typeof val === 'object'
      ? JSON.stringify(val)
      : val;
  }

  const manyToOneRels = model.relationships
    .filter(rel => rel.relType === RelType.MANY_TO_ONE);

  for (const rel of manyToOneRels) {
    if (!resource.relationships[rel.key]) continue;

    record[rel.key] = resource.relationships[rel.key].unwrapDataWith(it => it.id);
  }

  return record;
}
