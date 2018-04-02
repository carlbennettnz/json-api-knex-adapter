"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getKnexFromQuery(query) {
    return query.client.makeKnex(query.client);
}
exports.getKnexFromQuery = getKnexFromQuery;
