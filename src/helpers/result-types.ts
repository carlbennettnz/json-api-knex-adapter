import {
  Collection,
  Resource,
  Linkage,
  Relationship
} from 'json-api'

export function recordsToCollection(records, type, model, fields = []) {
  return new Collection(records.map(r => recordToResource(r, type, model, fields)));
}

export function recordToResource(record, type, model, fields = []) {
  const id = formatId(record[model.idKey]);
  const attrs = {};
  const relationships = {};

  model.attrs.forEach(({ key, deserialize }) => {
    if (record[key] != null) {
      attrs[key] = deserialize(record[key]);
    }
  });

  model.relationships.forEach(rel => {
    const fieldAllowed = fields.length === 0 || fields.includes(rel.key);

    if (!fieldAllowed || record[rel.key] == null) return;

    let linkage;

    if (rel.via == null) {
      linkage = new Linkage({
        type: rel.type,
        id: formatId(record[rel.key])
      });
    } else {
      const values = record[rel.key].filter(v => v != null).map(id => ({
        type: rel.type,
        id: formatId(id)
      }));

      linkage = new Linkage(values);
    }

    relationships[rel.key] = new Relationship(linkage);
  });

  return new Resource(type, id, attrs, relationships);
}

export function resourceToRecord(resource, model, { stringifyObjects = true } = {}) {
  const primary = {};

  for (const attr in resource.attrs) {
    const val = resource.attrs[attr];

    primary[attr] = stringifyObjects && val !== null && typeof val === 'object'
      ? JSON.stringify(val)
      : val;
  }

  for (const rel of model.relationships.filter(rel => !rel.via)) {
    if (!resource.relationships[rel.key]) continue;

    primary[rel.key] = resource.relationships[rel.key].linkage.value != null
      ? resource.relationships[rel.key].linkage.value.id
      : null;
  }

  // The linking records depend on the primary resource's ID, so we return a function that can be used to generate these once it is known
  const linksFn = primaryId => {
    const links = {};

    for (const rel of model.relationships.filter(rel => rel.relType === 'MANY_TO_MANY')) {
      // An empty array here is distinct from a missing relationship. Empty arrays indicate that the existing relationships should be
      // removed, whereas a missing key indicates that no change should be made.
      if (!resource.relationships[rel.key]) continue;

      // Map the resource's relationship sturcture to an array of values to be inserted into a linking table
      links[rel.via.table] = resource.relationships[rel.key].linkage.value
        .map(linkage => linkage.id)
        .map(id => ({ [rel.via.pk]: id, [rel.via.fk]: primaryId }));
    }

    return links;
  };

  return { primary, linksFn };
}

function formatId(id) {
  return id == null
    ? null
    : String(id);
}
