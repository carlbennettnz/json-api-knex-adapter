"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json_api_1 = require("json-api");
const model_interface_1 = require("../models/model-interface");
function applyRecordFilters(query, model, expr) {
    for (const subExpr of expr.args) {
        const isPredicate = ['and', 'or'].includes(subExpr.operator);
        if (isPredicate) {
            const whereVariant = getWhereVariant(expr.operator);
            query[whereVariant](function () {
                applyRecordFilters(this, model, subExpr);
            });
        }
        else {
            applyFieldConstraint(query, model, subExpr, expr.operator);
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
exports.SUPPORTED_OPERATORS = Object.keys(OPERATORS);
function applyFieldConstraint(query, model, { operator, args: [{ value: field }, value] }, logicalContext) {
    const qualifiedKey = getQualifiedKey(field, model);
    if (qualifiedKey === null) {
        throw new json_api_1.Error({
            status: 400,
            title: 'Bad filter',
            detail: `Path ${field} does not exist.`
        });
    }
    if (!(operator in OPERATORS)) {
        throw new json_api_1.Error({
            status: 400,
            title: 'Bad filter',
            detail: `Unknown operator ${operator}.`
        });
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
