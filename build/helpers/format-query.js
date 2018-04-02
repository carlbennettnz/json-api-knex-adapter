"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function formatQuery(query) {
    return '\t' + query
        .toString()
        .replace(/ (\(?(?:select|from|[a-z]+ join|where|order by|group by|having|limit)) /g, '\n\t$1 ');
}
exports.default = formatQuery;
