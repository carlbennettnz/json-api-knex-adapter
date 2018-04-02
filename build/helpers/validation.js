"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resource_to_primary_record_1 = require("./resource-to-primary-record");
const json_api_1 = require("json-api");
function validateResources(resources, models) {
    const errors = [];
    for (const res of resources) {
        const model = models[res.type];
        const relationships = model.relationships.map(r => r.key);
        for (const attr in res.attrs) {
            if (!model.attrs.find(a => a.key === attr)) {
                delete res.attrs[attr];
            }
        }
        for (const rel in res.relationships) {
            if (!relationships.includes(rel)) {
                delete res.relationships[rel];
            }
        }
        if (typeof model.validate === 'function') {
            model.validate.call(resource_to_primary_record_1.default(res, model, { stringifyObjects: false }));
        }
    }
    if (errors.length > 0) {
        throw errors;
    }
}
exports.validateResources = validateResources;
function ensureOneToManyRelsAreNotPresent(resources, models) {
    const errors = [];
    for (const res of resources) {
        const model = models[res.type];
        const relationships = model.relationships
            .filter(r => r.relType === 'ONE_TO_MANY')
            .map(r => r.key);
        for (const relKey of relationships) {
            if (res.relationships[relKey]) {
                const error = new json_api_1.Error(403, undefined, 'Illegal update to one-to-many relationship', 'There are many complex API design trade-offs around how to handle changes to one-to-many relationships. For example, if an ID '
                    + 'is removed from a to-many data array, what should happen to the newly orphaned foreign resource? As a result of issues '
                    + 'like this, updates to one-to-many relationships have been disallowed completely. Please do not include one-to-many '
                    + 'relationships in POST and PATCH requests.', { pointer: `/data/${resources.indexOf(res)}/relationships/${relKey}` });
                errors.push(error);
            }
        }
    }
    if (errors.length > 0) {
        throw errors;
    }
}
exports.ensureOneToManyRelsAreNotPresent = ensureOneToManyRelsAreNotPresent;
