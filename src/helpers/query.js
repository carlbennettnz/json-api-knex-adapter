module.exports.applySorts = function applySorts(query, sorts, model) {
  const sortObjs = sorts.map(s => ({
    // Replace `'id'` with the `idKey`
    attr: /^-?id$/.test(s) ? model.idKey : s.replace(/^-/, ''),

    // Attrs prefixed with '-' mean desc
    dir: /^-/.test(s) ? 'desc' : 'asc'
  }));

  // Filter out sorts of key not in the model. Important for security as this prevents sorting by hidden, private
  // attributes, potentially resulting in data leakage.
  const validSorts = sortObjs.filter(({ attr }) => {
    return attr === model.idKey || model.attrs.includes(attr);
  });

  for (const sort of validSorts) {
    query = query.orderBy(sort.attr, sort.dir);
  }

  return query;
};

module.exports.applyFilters = function applyFilters(query, filters) {
  throw new Error('Not implemented');
};
