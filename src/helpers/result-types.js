const {
  Collection,
  Resource,
  Linkage,
  Relationship
} = require('resapi').types;

function recordsToCollection(records, type, model, fields = []) {
  return new Collection(records.map(r => recordToResource(r, type, model, fields)));
}

function recordToResource(record, type, model, fields = []) {
  const id = formatId(record[model.idKey]);
  const attrs = {};
  const relationships = {};

  model.attrs.forEach(({ key }) => {
    if (record[key] != null) {
      attrs[key] = record[key];
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

function resourceToRecord(resource, model) {
  const record = { ...resource.attrs };

  for (const rel in resource.relationships) {
    record[rel] = resource.relationships[rel].linkage.value != null
      ? resource.relationships[rel].linkage.value.id
      : null;
  }

  return record;
}

function formatId(id) {
  return id == null
    ? null
    : String(id);
}

module.exports.recordsToCollection = recordsToCollection;
module.exports.recordToResource = recordToResource;
module.exports.resourceToRecord = resourceToRecord;
