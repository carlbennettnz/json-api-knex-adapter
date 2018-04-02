"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model_interface_1 = require("./model-interface");
function normalizeModels(models) {
    const normalizedModels = {};
    const modelTables = Object.values(models).map(model => model.table);
    for (const type in models) {
        const model = models[type];
        const normalizedModel = {
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
exports.default = normalizeModels;
function normalizeIdKey(idKey) {
    return idKey == null ? 'id' : idKey;
}
function normalizeAttrs(attrs = []) {
    const normalizedAttrs = [];
    for (let attr of attrs) {
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
function normalizeRelationships(rels = [], modelTables) {
    const normalizedRels = [];
    for (const rel of rels || []) {
        const normalizedRel = {
            key: rel.key,
            type: rel.type,
            relType: model_interface_1.RelType.MANY_TO_ONE
        };
        if (rel.via) {
            normalizedRel.via = Object.assign({}, rel.via);
        }
        if (rel.relType) {
            normalizedRel.relType = rel.relType;
        }
        else if (rel.via && modelTables.includes(rel.via.table)) {
            normalizedRel.relType = model_interface_1.RelType.ONE_TO_MANY;
        }
        else if (rel.via) {
            normalizedRel.relType = model_interface_1.RelType.MANY_TO_MANY;
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
