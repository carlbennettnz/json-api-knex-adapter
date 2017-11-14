function normalizeModels(models) {
  const normalizedModels = {};

  for (const type in models) {
    const model = models[type];

    const normalizedModel = {
      table: model.table,
      idKey: normalizeIdKey(model.idKey),
      attrs: normalizeAttrs(model.attrs),
      relationships: normalizeRelationships(model.relationships)
    };

    normalizedModels[type] = normalizedModel;
  }

  return normalizedModels;
}

function normalizeIdKey(idKey) {
  return idKey == null ? 'id' : idKey;
}

function normalizeAttrs(attrs) {
  const normalizedAttrs = [];

  for (let attr of attrs || []) {
    if (typeof attr === 'string') {
      attr = { key: attr };
    }

    const normalizedAttr = {
      key: attr.key,
      serialize: nullSerialize,
      deserialize: nullDeserialize
    };

    if (attr.serialize) {
      normalizedAttr.serialize = attr.serialize;
    }

    if (attr.deserialize) {
      normalizedAttr.deserialize = attr.deserialize;
    }

    normalizedAttrs.push(normalizedAttr);
  }

  return normalizedAttrs;
}

function normalizeRelationships(rels) {
  const normalizedRels = [];

  for (const rel of rels || []) {
    const normalizedRel = {
      key: rel.key,
      type: rel.type
    };

    if ('via' in rel) {
      normalizedRel.via = { ...rel.via };
    }

    normalizedRels.push(normalizedRel);
  }

  return normalizedRels;
}

function nullSerialize(val) {
  return val;
}

function nullDeserialize(val) {
  return val;
}

module.exports = normalizeModels;