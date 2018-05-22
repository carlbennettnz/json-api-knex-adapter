"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json_api_1 = require("json-api");
const model_interface_1 = require("../models/model-interface");
function recordToResource(record, type, model, fields = []) {
    const id = String(record[model.idKey]);
    const attrs = {};
    const relationships = {};
    for (const { key, deserialize } of model.attrs) {
        if (record[key] == null)
            continue;
        attrs[key] = deserialize(record[key]);
    }
    for (const rel of model.relationships) {
        const fieldAllowed = fields.length === 0 || fields.includes(rel.key);
        if (!fieldAllowed || record[rel.key] == null)
            continue;
        const linkage = rel.relType === model_interface_1.RelType.MANY_TO_ONE
            ? getToOneLinkage(type, record[rel.key])
            : getToManyLinkage(type, record[rel.key]);
        relationships[rel.key] = json_api_1.Relationship.of({
            data: linkage,
            owner: { type, id, path: rel.key }
        });
    }
    const resource = new json_api_1.Resource(type, id, attrs, relationships);
    resource.typePath = [type];
    return resource;
}
exports.default = recordToResource;
function getToOneLinkage(type, id) {
    return json_api_1.Data.pure(new json_api_1.ResourceIdentifier(type, String(id)));
}
function getToManyLinkage(type, ids) {
    return json_api_1.Data.of(ids
        .filter(id => id !== null)
        .map(id => new json_api_1.ResourceIdentifier(type, String(id))));
}
