"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json_api_1 = require("json-api");
const model_interface_1 = require("../models/model-interface");
function applyRecordFilters(query, model, predicate) {
    for (const predicateOrConstraint of predicate.value) {
        const isPredicate = ['and', 'or'].includes(predicateOrConstraint.operator);
        if (isPredicate) {
            const whereVariant = getWhereVariant(predicate.operator);
            query[whereVariant](function () {
                applyRecordFilters(this, model, predicateOrConstraint);
            });
        }
        else {
            applyFieldConstraint(query, model, predicateOrConstraint, predicate.operator);
        }
    }
}
exports.default = applyRecordFilters;
function getWhereVariant(operator) {
    return operator === 'and'
        ? 'andWhere'
        : 'orWhere';
}
const OPERATORS = {
    eq: '=',
    ne: '!=',
    neq: '!=',
    in: 'in',
    nin: 'not in',
    lt: '<',
    gt: '>',
    lte: '<=',
    gte: '>='
};
function applyFieldConstraint(query, model, { field, value, operator }, logicalContext) {
    const qualifiedKey = getQualifiedKey(field, model);
    if (qualifiedKey === null) {
        throw new json_api_1.Error(400, undefined, 'Bad filter', `Path ${field} does not exist.`);
    }
    if (!(operator in OPERATORS)) {
        throw new json_api_1.Error(400, undefined, 'Bad filter', `Unknown operator ${operator}.`);
    }
    const whereVariant = getWhereVariant(logicalContext);
    query[whereVariant](qualifiedKey, OPERATORS[operator], value);
}
function getQualifiedKey(key, model) {
    if (key === 'id') {
        return `${model.table}.${model.idKey}`;
    }
    if (model.attrs.some(attr => attr.key === key)) {
        return `${model.table}.${key}`;
    }
    const rel = model.relationships.find(r => r.key === key);
    if (rel == null) {
        return null;
    }
    return rel.relType === model_interface_1.RelType.MANY_TO_MANY && rel.via
        ? `${rel.via.table}.${rel.via.pk}`
        : `${model.table}.${key}`;
}
