"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function applyFieldFilters(query, model, fields) {
    if (fields.length === 0) {
        query.select(`${model.table}.*`);
        return;
    }
    if (!fields.includes(model.idKey)) {
        fields.push(model.idKey);
    }
    query.select(fields);
}
exports.default = applyFieldFilters;
;
