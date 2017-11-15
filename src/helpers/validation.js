const { Error: APIError } = require('resapi').types;
const { resourceToRecord } = require('./result-types');

function validateResources(resources, models) {
  const errors = [];

  for (const res of resources) {
    const model = models[res.type]; // TODO: Handle mising model
    const relationships = model.relationships.map(r => r.key);

    for (const attr in res.attrs) {
      if (!model.attrs.find(a => a.key === attr)) {
        // We really, really should be doing this, but it's not the way Mongoose works, so I've removed it for now.
        // const error = new APIError(400, undefined, 'Bad attribute', `The provided attribute ${attr} does not exist on the model.`);
        // errors.push(error);
        delete res.attrs[attr];
      }
    }

    for (const rel in res.relationships) {
      if (!relationships.includes(rel)) {
        // Same as above
        // const error = new APIError(400, undefined, 'Bad relationship', `The provided relationship ${rel} does not exist on the model.`);
        // errors.push(error);
        delete res.relationships[rel];
      }
    }

    if (typeof model.validate === 'function') {
      model.validate.call(resourceToRecord(res, { stringifyObjects: false }));
    }
  }

  if (errors.length > 0) {
    throw errors;
  }
}

module.exports.validateResources = validateResources;
