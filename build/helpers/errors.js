"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json_api_1 = require("json-api");
const NOT_NULL_ERR_COL_NAME = /null value in column "(.+)" violates not-null constraint$/;
function handleQueryError(err) {
    throw err;
}
exports.handleQueryError = handleQueryError;
function handleSaveError(err, model) {
    if (err.code === '23502' && NOT_NULL_ERR_COL_NAME.test(err.toString())) {
        const col = err.toString().match(NOT_NULL_ERR_COL_NAME)[1];
        throw new json_api_1.Error({
            status: 400,
            title: `Path \`${col}\` is required.`
        });
    }
    throw err;
}
exports.handleSaveError = handleSaveError;
