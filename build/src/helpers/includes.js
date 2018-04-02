"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const json_api_1 = require("json-api");
const lodash_es_1 = require("lodash-es");
const debugFactory = require("debug");
const format_query_1 = require("./format-query");
const result_types_1 = require("./result-types");
const debug = debugFactory('resapi:pg');
function getIncludedResources(knex, query, paths, models, primaryType) {
    return __awaiter(this, void 0, void 0, function* () {
        const model = models[primaryType];
        const rels = model.relationships;
        validatePaths(paths, rels);
        const relsToInclude = paths.map(path => rels.find(rel => rel.key === path));
        const relsByType = lodash_es_1.groupBy(relsToInclude, 'type');
        const queries = [];
        for (const type in relsByType) {
            const { direct = [], linked = [] } = lodash_es_1.groupBy(relsByType[type], rel => rel.via == null ? 'direct' : 'linked');
            const subqueries = [
                ...direct.map(rel => query.clone().distinct(rel.key)),
                ...linked.map(rel => getSubqueryForLinkedRel(knex, query, model, rel))
            ];
            const includeQuery = getQueryForType(knex, models[type], subqueries);
            debug('executing query for included resources:');
            debug(format_query_1.default(includeQuery));
            queries.push(includeQuery.then(result => [type, result]));
        }
        const resources = yield Promise.all(queries).then(results => {
            return results.reduce((prev, [type, result]) => prev.concat(result.map(record => result_types_1.recordToResource(record, type, models[type]))), []);
        });
        return new Collection(resources);
    });
}
function validatePaths(paths, rels) {
    const pathErrors = paths
        .filter(path => !rels.some(rel => rel.key === path))
        .map(badPath => new json_api_1.Error(400, undefined, 'Bad include', `Included path '${badPath}' is not a relationship on this model.`));
    if (pathErrors.length > 0) {
        throw pathErrors;
    }
}
function getSubqueryForLinkedRel(knex, query, model, rel) {
    const foreignPK = `"${rel.via.table}"."${rel.via.pk}"`;
    const localPK = `${model.table}.${model.idKey}`;
    const foreignFK = `${rel.via.table}.${rel.via.fk}`;
    return query.clone()
        .distinct(knex.raw(`${foreignPK} as "${rel.key}"`))
        .leftJoin(rel.via.table, localPK, foreignFK);
}
function getQueryForType(knex, { table, idKey }, subqueries) {
    let includeQuery = knex(table);
    for (const subquery of subqueries) {
        includeQuery = includeQuery.orWhereIn(idKey, subquery);
    }
    return includeQuery;
}
exports.default = getIncludedResources;
