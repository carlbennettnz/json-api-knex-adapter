const { Error: APIError } = require('resapi').types;

function validateResources(resources, models) {
  const errors = [];

  for (const res of resources) {
    const model = models[res.type]; // TODO: Handle mising model
    const relationships = model.relationships.map(r => r.key);

    for (const attr in res.attrs) {
      if (!model.attrs.find(a => a.key === attr)) {
        const error = new APIError(400, undefined, 'Bad attribute', `The provided attribute ${attr} does not exist on the model.`);
        errors.push(error);
      }
    }

    for (const rel in res.relationships) {
      if (!relationships.includes(rel)) {
        const error = new APIError(400, undefined, 'Bad relationship', `The provided relationship ${rel} does not exist on the model.`);
        errors.push(error);
      }
    }
  }

  if (errors.length > 0) {
    throw errors;
  }
}

module.exports.validateResources = validateResources;
