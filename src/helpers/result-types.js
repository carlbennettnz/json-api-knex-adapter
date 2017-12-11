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

function resourceToRecord(resource, model, { stringifyObjects = true } = {}) {
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

  const linksFn = primaryId => {
    const links = {};

    for (const rel of model.relationships.filter(rel => 'via' in rel)) {
      if (!resource.relationships[rel.key] || resource.relationships[rel.key].linkage.value.length === 0) continue;

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

module.exports.recordsToCollection = recordsToCollection;
module.exports.recordToResource = recordToResource;
module.exports.resourceToRecord = resourceToRecord;
