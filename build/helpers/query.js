"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json_api_1 = require("json-api");
function applySorts(query, sorts, model) {
    const sortObjs = sorts.map(s => ({
        attr: /^-?id$/.test(s) ? model.idKey : s.replace(/^-/, ''),
        dir: /^-/.test(s) ? 'desc' : 'asc'
    }));
    const invalidSorts = sortObjs.filter(({ attr }) => {
        return attr !== model.idKey
            && !model.attrs.map(attr => attr.key).includes(attr)
            && !model.relationships.map(r => r.attr).includes(attr);
    });
    if (invalidSorts.length) {
        throw invalidSorts.map(({ attr }) => new json_api_1.Error(400, undefined, 'Invalid sort', `The attribute '${attr}' does not exist as an attribute or relationship on this model.'`));
    }
    for (const sort of sortObjs) {
        const rel = model.relationships.find(r => r.key === sort.attr);
        const table = rel && rel.via ? rel.via.table : model.table;
        query = query.orderBy(`${table}.${sort.attr}`, sort.dir);
    }
    return query;
}
exports.applySorts = applySorts;
;
