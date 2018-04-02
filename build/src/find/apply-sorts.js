"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model_interface_1 = require("../models/model-interface");
const json_api_1 = require("json-api");
function applySorts(query, model, sorts) {
    if (sorts == null)
        return;
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
    const invalidSorts = sorts.filter(({ field }) => !validKeys.includes(field));
    if (invalidSorts.length > 0) {
        throw invalidSorts.map(({ field }) => new json_api_1.Error(400, null, 'Invalid sort', `The attribute '${field}' does not exist as an attribute or relationship on this model.'`));
    }
}
