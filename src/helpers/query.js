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

module.exports.applyFilters = function applyFilters(query, filters) {
  throw new Error('Not implemented');
};
