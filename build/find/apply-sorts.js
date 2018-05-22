"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model_interface_1 = require("../models/model-interface");
const json_api_1 = require("json-api");
function applySorts(query, model, sorts) {
    if (sorts == null)
        return;
    console.log(sorts);
    validateSorts(model, sorts);
    for (const { field, direction } of sorts) {
        const key = field === 'id' ? model.idKey : field;
        query.orderBy(`${model.table}.${key}`, direction.toLowerCase());
    }
}
exports.default = applySorts;
;
function validateSorts(model, sorts) {
    const validKeys = [
        'id',
        ...model.attrs.map(attr => attr.key),
        ...model.relationships
            .filter(rel => rel.relType === model_interface_1.RelType.MANY_TO_ONE)
            .map(rel => rel.key)
    ];
    const invalidSorts = sorts.filter(sort => !('field' in sort) || !validKeys.includes(sort.field));
    if (invalidSorts.length > 0) {
        throw invalidSorts.map(sort => new json_api_1.Error({
            status: 400,
            title: 'Invalid sort',
            detail: `The attribute '${'field' in sort ? sort.field : JSON.stringify(sort)}'`
                + `does not exist as an attribute or relationship on this model.'`
        }));
    }
}
