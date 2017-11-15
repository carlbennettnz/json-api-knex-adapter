const APIError = require('resapi').types.Error;

const NOT_NULL_ERR_COL_NAME = /null value in column "(.+)" violates not-null constraint$/;

function handleQueryError(err) {
  throw err;
}

function handleSaveError(err, model) {
  if (err.code === '23502' && NOT_NULL_ERR_COL_NAME.test(err.toString())) {
    const col = err.toString().match(NOT_NULL_ERR_COL_NAME)[1];
    throw new APIError(400, undefined, `Path \`${col}\` is required.`);
  }

  throw err;
}

module.exports.handleQueryError = handleQueryError;
module.exports.handleSaveError = handleSaveError;
