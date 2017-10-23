const APIError = require('resapi').types.Error;

module.exports.applySorts = function applySorts(query, sorts, model) {
  const sortObjs = sorts.map(s => ({
    // Replace `'id'` with the `idKey`
    attr: /^-?id$/.test(s) ? model.idKey : s.replace(/^-/, ''),

    // Attrs prefixed with '-' mean desc
    dir: /^-/.test(s) ? 'desc' : 'asc'
  }));

  // Catch sorts of keys not in the model. Important for security as this prevents sorting by hidden, private attributes, potentially
  // resulting in data leakage.
  const invalidSorts = sortObjs.filter(({ attr }) => {
    return attr !== model.idKey
      && !model.attrs.includes(attr)
      && !model.relationships.map(r => r.attr).includes(attr);
  });

  if (invalidSorts.length) {
    throw invalidSorts.map(({ attr }) =>
      new APIError(400, null, 'Invalid sort', `The attribute '${attr}' does not exist as an attribute or relationship on this model.'`)
    );
  }

  for (const sort of sortObjs) {
    query = query.orderBy(sort.attr, sort.dir);
  }

  return query;
};

/**
 * Takes a MongoDB query object and and applies it to a knex query. Only supports comparison operators.
 *
 * @param  {Query}  query   Knex query.
 * @param  {Object} filters [MongoDB query](https://docs.mongodb.com/manual/reference/operator/query/).
 * @return {Query}          Knex query with filters applied.
 */
module.exports.applyFilters = function applyFilters(query, filters) {
  if (typeof filters !== 'object') {
    throw new APIError(400, undefined, 'Bad filter', 'Filters must be an object.');
  }

  for (const key in filters) {
    let val = filters[key];

    if (typeof key !== 'string' || key.startsWith('$')) {
      throw new APIError(400, undefined, 'Bad filter', `Expected to find an attribute name, got ${key}. Logical operators are not supported.`)
    }

    if (val === null || typeof val !== 'object') {
      val = { $eq: val };
    }

    query = applyComparisonOperators(query, key, val);
  }

  return query;
};

const OPERATORS = {
  $eq: '=',
  $ne: '!=',
  $in: 'in',
  $nin: 'not in',
  $lt: '<',
  $gt: '>',
  $lte: '<=',
  $gte: '>='
};

function applyComparisonOperators(query, key, obj) {
  for (const op in obj) {
    if (!(op in OPERATORS)) {
      throw new APIError(400, undefined, 'Bad filter', `Unknown operator ${op}.`);
    }

    query = query.where(key, OPERATORS[op], obj[op]);
  }

  return query;
}
