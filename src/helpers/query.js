module.exports.applySorts = function applySorts(query, sorts) {
  for (const sort of sorts) {
    query = query.orderBy(
      sort.replace(/^-/, ''), // remove the inverter, if present
      sort[0] === '-' ? 'desc' : 'asc'
    );
  }

  return query;
};

module.exports.applyFilters = function applyFilters(query, filters) {
  throw new Error('Not implemented');
};
