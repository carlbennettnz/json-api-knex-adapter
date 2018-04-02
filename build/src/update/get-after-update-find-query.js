"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json_api_1 = require("json-api");
function getAfterUpdateFindQuery(query) {
    const findQueryOpts = {
        type: query.type,
        returning: query.returning
    };
    const ids = query.patch.map(res => res.id).unwrap();
    return new json_api_1.FindQuery(findQueryOpts).matchingIdOrIds(ids);
}
exports.default = getAfterUpdateFindQuery;
