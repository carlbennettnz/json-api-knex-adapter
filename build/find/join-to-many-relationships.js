"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model_interface_1 = require("../models/model-interface");
const knex_1 = require("../helpers/knex");
function joinToManyRelationships(query, model, fields) {
    const knex = knex_1.getKnexFromQuery(query);
    const linkedRels = model.relationships.filter(rel => rel.relType !== model_interface_1.RelType.MANY_TO_ONE
        && (fields.length === 0 || fields.includes(rel.key)));
    for (const rel of linkedRels) {
        const { table, pk, fk } = rel.via;
        query
            .select(knex.raw(`array_agg(distinct "${table}"."${pk}"::text) as "${rel.key}"`))
            .leftJoin(table, `${model.table}.${model.idKey}`, `${table}.${fk}`);
    }
    if (linkedRels.length > 0) {
        query.groupBy(`${model.table}.${model.idKey}`);
    }
}
exports.default = joinToManyRelationships;
;
