import { Relationship, StrictAttr, StrictRelationship, RelType, ToManyRelationship, Model } from "../models/model-interface";

export default function normalizeModels(models: { [name: string]: Model }) {
  const normalizedModels = {};
  const modelTables = Object.values(models).map(model => model.table);

  for (const type in models) {
    const model = models[type];

    const normalizedModel = {
      table: model.table,
      idKey: normalizeIdKey(model.idKey),
      attrs: normalizeAttrs(model.attrs),
      relationships: normalizeRelationships(model.relationships, modelTables)
    };

    normalizedModels[type] = normalizedModel;
  }

  return normalizedModels;
}

function normalizeIdKey(idKey) {
  return idKey == null ? 'id' : idKey;
}

function normalizeAttrs(attrs) {
  const normalizedAttrs: StrictAttr[] = [];

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

/**
 * Ensures models match the required format, and also attempts to automatically determine each relationship's relType. If a relType is
 * provided, we just use that. Otherwise, if rel.via.table is a table we have defined as a model, we assume the relationship is
 * ONE_TO_MANY. If the table isn't known, but the relationship is linked, we assume MANY_TO_MANY. If the relationship isn't linked,
 * we assume MANY_TO_ONE.
 *
 * @param  {Object[]} rels        The relationships array for a model.
 * @param  {String[]} modelTables The names of the tables of the defined models, including the model of these relationships.
 * @return {Object[]}             Normalized relationships.
 */
function normalizeRelationships(rels, modelTables) {
  const normalizedRels: StrictRelationship[] = [];

  for (const rel of rels || []) {
    const normalizedRel = {
      key: rel.key,
      type: rel.type,
      relType: null as (null | RelType)
    } as Relationship;

    // Clone the via object
    if ('via' in rel) {
      normalizedRel.via = { ...rel.via };
    }

    // Set the relType
    if (rel.relType) {
      normalizedRel.relType = rel.relType;
    } else if ('via' in rel && modelTables.includes((<ToManyRelationship>normalizedRel).via.table)) {
      normalizedRel.relType = RelType.ONE_TO_MANY;
    } else if ('via' in rel) {
      normalizedRel.relType = RelType.MANY_TO_MANY;
    } else {
      normalizedRel.relType = RelType.MANY_TO_ONE;
    }

    normalizedRels.push(normalizedRel as StrictRelationship);
  }

  return normalizedRels;
}

function nullSerialize(val) {
  return val;
}

function nullDeserialize(val) {
  return val;
}
