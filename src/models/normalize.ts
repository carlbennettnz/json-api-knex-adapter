import {
    Attr,
    Relationship,
    Model,
    Models,
    StrictAttr,
    StrictRelationship,
    StrictModel,
    StrictModels,
    RelType
} from './model-interface'

export default function normalizeModels(models: Models): StrictModels {
    const normalizedModels: StrictModels = {};
    const modelTables = Object.values(models).map(model => model.table);
  
    for (const type in models) {
      const model = models[type];
  
      const normalizedModel: StrictModel = {
        table: model.table,
        idKey: normalizeIdKey(model.idKey),
        attrs: normalizeAttrs(model.attrs),
        relationships: normalizeRelationships(model.relationships, modelTables),
        transforms: model.transforms
      };
  
      normalizedModels[type] = normalizedModel;
    }
  
    return normalizedModels;
  }
  
  function normalizeIdKey(idKey) {
    return idKey == null ? 'id' : idKey;
  }
  
  function normalizeAttrs(attrs: (string | Attr)[] = []): StrictAttr[] {
    const normalizedAttrs: StrictAttr[] = [];
  
    for (let attr of attrs) {
      if (typeof attr === 'string') {
        attr = { key: attr };
      }
  
      const normalizedAttr: StrictAttr = {
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
   * Ensures models match the required format, and also attempts to automatically determine each
   * relationship's relType. If a relType is provided, we just use that. Otherwise, if
   * rel.via.table is a table we have defined as a model, we assume the relationship is
   * ONE_TO_MANY. If the table isn't known, but the relationship is linked, we assume MANY_TO_MANY.
   * If the relationship isn't linked, we assume MANY_TO_ONE.
   *
   * @param  {Object[]} rels        The relationships array for a model.
   * @param  {String[]} modelTables The names of the tables of the defined models, including the
   *                                model of these relationships.
   * @return {Object[]}             Normalized relationships.
   */
  function normalizeRelationships(
    rels: Relationship[] = [],
    modelTables: string[]
  ): StrictRelationship[] {
    const normalizedRels: StrictRelationship[] = [];
  
    for (const rel of rels || []) {
      const normalizedRel: StrictRelationship = {
        key: rel.key,
        type: rel.type,
        relType: RelType.MANY_TO_ONE
      };
  
      // Clone the via object
      if (rel.via) {
        normalizedRel.via = { ...rel.via };
      }
  
      // Set the relType
      if (rel.relType) {
        normalizedRel.relType = rel.relType;
      } else if (rel.via && modelTables.includes(rel.via.table)) {
        normalizedRel.relType = RelType.ONE_TO_MANY;
      } else if (rel.via) {
        normalizedRel.relType = RelType.MANY_TO_MANY;
      }
  
      normalizedRels.push(normalizedRel);
    }
  
    return normalizedRels;
  }
  
  function nullSerialize(val: any): any {
    return val;
  }
  
  function nullDeserialize(val: any): any {
    return val;
  }
  