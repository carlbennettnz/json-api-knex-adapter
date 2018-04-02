"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model_interface_1 = require("../models/model-interface");
function resourceToPrimaryRecord(resource, model, { stringifyObjects = true } = {}) {
    const record = {};
    for (const attr in resource.attrs) {
        const val = resource.attrs[attr];
        record[attr] = stringifyObjects && val !== null && typeof val === 'object'
            ? JSON.stringify(val)
            : val;
    }
    const manyToOneRels = model.relationships
        .filter(rel => rel.relType === model_interface_1.RelType.MANY_TO_ONE);
    for (const rel of manyToOneRels) {
        if (!resource.relationships[rel.key])
            continue;
        record[rel.key] = resource.relationships[rel.key].unwrapDataWith(it => it.id);
    }
    return record;
}
exports.default = resourceToPrimaryRecord;
