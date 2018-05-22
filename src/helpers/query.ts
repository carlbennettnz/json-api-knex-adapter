import { Error as APIError } from 'json-api'

export function applySorts(query, sorts, model) {
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
      && !model.attrs.map(attr => attr.key).includes(attr)
      && !model.relationships.map(r => r.attr).includes(attr);
  });

  if (invalidSorts.length) {
    throw invalidSorts.map(({ attr }) =>
      new APIError({
        status: 400, 
        title: 'Invalid sort',
        detail: `The attribute '${attr}' does not exist as an attribute or relationship on this model.'`
      })
    );
  }

  for (const sort of sortObjs) {
    const rel = model.relationships.find(r => r.key === sort.attr);
    const table = rel && rel.via ? rel.via.table : model.table;
    query = query.orderBy(`${table}.${sort.attr}`, sort.dir);
  }

  return query;
};

