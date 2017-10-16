const {
  Collection,
  Resource,
  Linkage
} = require('resapi').types;

function recordsToCollection(records, type, model, fields = []) {
  return new Collection(records.map(r => recordToResource(r, type, model, fields)));
}

function recordToResource(record, type, model, fields = []) {
  const id = String(record[model.idKey]);
  const attrs = {};
  const relationships = {};

  model.attrs.forEach(key => {
    if (record[key] != null) {
      attrs[key] = record[key];
    }
  });

  // TODO: One-to-many relationships, probably supported via a linking table
  model.relationships.forEach(rel => {
    const fieldAllowed = fields.length === 0 || fields.includes(rel.key);

    if (!fieldAllowed || record[rel.key] == null) return;

    relationships[rel.key] = new Linkage({
      type: rel.type,
      id: String(record[rel.key])
    });
  });

  return new Resource(type, id, attrs, relationships);
}

function resourceToRecord(resource, model) {
  const record = { ...resource.attrs };

  for (const rel in resource.relationships) {
    record[rel] = resource.relationships[rel].linkage.value.id;
  }

  return record;
}

module.exports.recordsToCollection = recordsToCollection;
module.exports.recordToResource = recordToResource;
module.exports.resourceToRecord = resourceToRecord;
