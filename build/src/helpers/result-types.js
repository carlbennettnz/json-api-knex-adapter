"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json_api_1 = require("json-api");
function recordsToCollection(records, type, model, fields = []) {
    return new json_api_1.Collection(records.map(r => recordToResource(r, type, model, fields)));
}
exports.recordsToCollection = recordsToCollection;
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
        if (!fieldAllowed || record[rel.key] == null)
            return;
        let linkage;
        if (rel.via == null) {
            linkage = new json_api_1.Linkage({
                type: rel.type,
                id: formatId(record[rel.key])
            });
        }
        else {
            const values = record[rel.key].filter(v => v != null).map(id => ({
                type: rel.type,
                id: formatId(id)
            }));
            linkage = new json_api_1.Linkage(values);
        }
        relationships[rel.key] = new json_api_1.Relationship(linkage);
    });
    return new json_api_1.Resource(type, id, attrs, relationships);
}
exports.recordToResource = recordToResource;
function resourceToRecord(resource, model, { stringifyObjects = true } = {}) {
    const primary = {};
    for (const attr in resource.attrs) {
        const val = resource.attrs[attr];
        primary[attr] = stringifyObjects && val !== null && typeof val === 'object'
            ? JSON.stringify(val)
            : val;
    }
    for (const rel of model.relationships.filter(rel => !rel.via)) {
        if (!resource.relationships[rel.key])
            continue;
        primary[rel.key] = resource.relationships[rel.key].linkage.value != null
            ? resource.relationships[rel.key].linkage.value.id
            : null;
    }
    const linksFn = primaryId => {
        const links = {};
        for (const rel of model.relationships.filter(rel => rel.relType === 'MANY_TO_MANY')) {
            if (!resource.relationships[rel.key])
                continue;
            links[rel.via.table] = resource.relationships[rel.key].linkage.value
                .map(linkage => linkage.id)
                .map(id => ({ [rel.via.pk]: id, [rel.via.fk]: primaryId }));
        }
        return links;
    };
    return { primary, linksFn };
}
exports.resourceToRecord = resourceToRecord;
function formatId(id) {
    return id == null
        ? null
        : String(id);
}
