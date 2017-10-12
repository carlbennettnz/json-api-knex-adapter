const {
  Collection,
  Resource,
  Linkage
} = require('resapi').types;

function recordsToCollection(records, type, models) {
  return new Collection(records.map(r => recordToResource(r, type, models)));
};

function recordToResource(record, type, models) {
  const attrs = {};
  const relationships = {};

  models[type].attrs.forEach(key => {
    if (record[key] != null) {
      attrs[key] = record[key];
    }
  });

  // TODO: One-to-many relationships, probably supported via a linking table
  models[type].relationships.forEach(rel => {
    relationships[rel.key] = new Linkage({
      type: rel.type,
      id: String(record[rel.key])
    });
  });

  return new Resource(type, String(record.id), attrs, relationships);
};

module.exports.recordsToCollection = recordsToCollection;
module.exports.recordToResource = recordToResource;
