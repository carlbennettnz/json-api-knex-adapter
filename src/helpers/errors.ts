import { Error as APIError } from 'json-api'

const NOT_NULL_ERR_COL_NAME = /null value in column "(.+)" violates not-null constraint$/

const PG_ERR_REQUIRED_FIELD = '23502';
const PG_ERR_STILL_REFERENCED = '23503';

export function handleQueryError(err) {
  throw err;
}

export function handleSaveError(err, model) {
  if (err.code === PG_ERR_REQUIRED_FIELD && NOT_NULL_ERR_COL_NAME.test(err.toString())) {
    const col = err.toString().match(NOT_NULL_ERR_COL_NAME)[1];
    throw new APIError({
      status: 400, 
      title: `Path \`${col}\` is required.`
    });
  }

  throw err;
}

export function handleDeleteError(err, model) {
  if (err.code === PG_ERR_STILL_REFERENCED) {
    throw new APIError({
      status: 409,
      title: 'Cannot delete resource referenced by another resource.',
      detail: `Cannot delete ${model.table} as it is still referenced in ${err.table}`
    });
  }
  
  throw err;
}
