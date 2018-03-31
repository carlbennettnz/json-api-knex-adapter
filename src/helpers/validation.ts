import resourceToPrimaryRecord from './resource-to-primary-record'
import { Error as APIError } from 'json-api'

export function validateResources(resources, models) {
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

    // TODO: Remove. Only needed for Out There, and we only use it in one place.
    if (typeof model.validate === 'function') {
      model.validate.call(resourceToPrimaryRecord(res, model, { stringifyObjects: false }));
    }
  }

  if (errors.length > 0) {
    throw errors;
  }
}

/**
 * There are many complex API design trade-offs around how to handle changes to one-to-many relationships. For example, if an ID is removed
 * from a to-many data array, what should happen to the newly orphaned foreign resource? As a result of issues like this, updates to
 * one-to-many relationships have been disallowed completely. This function checks they are not present in the provided resources, and
 * throws an array of APIErrors otherwise.
 *
 * @param  {Resource[]} resources The resources to check.
 * @param  {Object}     models    The model definitions.
 * @return {void}
 * @throws {APIError[]} If one-to-many relationships are found.
 */
export function ensureOneToManyRelsAreNotPresent(resources, models) {
  const errors = [];

  for (const res of resources) {
    const model = models[res.type]; // TODO: Handle missing model
    const relationships = model.relationships
      .filter(r => r.relType === 'ONE_TO_MANY')
      .map(r => r.key);

    for (const relKey of relationships) {
      if (res.relationships[relKey]) {
        const error = new APIError(
          403,
          undefined,
          'Illegal update to one-to-many relationship',
          'There are many complex API design trade-offs around how to handle changes to one-to-many relationships. For example, if an ID '
            + 'is removed from a to-many data array, what should happen to the newly orphaned foreign resource? As a result of issues '
            + 'like this, updates to one-to-many relationships have been disallowed completely. Please do not include one-to-many '
            + 'relationships in POST and PATCH requests.',
          { pointer: `/data/${resources.indexOf(res)}/relationships/${relKey}` }            
        );

        errors.push(error);
      }
    }
  }

  if (errors.length > 0) {
    throw errors;
  }
}
