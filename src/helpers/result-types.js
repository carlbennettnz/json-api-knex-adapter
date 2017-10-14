const {
  Collection,
  Resource,
  Linkage
} = require('resapi').types;

function recordsToCollection(records, type, models, fields) {
  return new Collection(records.map(r => recordToResource(r, type, models, fields)));
};

function recordToResource(record, type, models, fields) {
  const id = String(record[models[type].idKey]);
  const attrs = {};
  const relationships = {};

  models[type].attrs.forEach(key => {
    if (record[key] != null) {
      attrs[key] = record[key];
    }
  });

  // TODO: One-to-many relationships, probably supported via a linking table
  models[type].relationships.forEach(rel => {
    if (fields && fields.length > 0 && !fields.includes(rel.key)) {
      return;
    }

    const linkage = { type: rel.type };

    if (record[rel.key] != null) {
      linkage.id = String(record[rel.key]);
    }

    relationships[rel.key] = new Linkage(linkage);
  });

  return new Resource(type, id, attrs, relationships);
};

module.exports.recordsToCollection = recordsToCollection;
module.exports.recordToResource = recordToResource;
