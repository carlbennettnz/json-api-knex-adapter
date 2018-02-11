/* eslint-disable complexity */

const ALLOWED_ATTR_PROPS = [
  'key',
  'serialize',
  'deserialize'
];

const ALLOWED_REL_PROPS = [
  'key',
  'type',
  'via',
  'relType'
];

const ALLOWED_REL_VIA_PROPS = [
  'table',
  'pk',
  'fk'
];

function validateModels(models) {
  for (const modelName in models) {
    const model = models[modelName];

    validateModelExistance(model, modelName);
    validateTableName(model, modelName);
    validateIdKey(model, modelName);
    validateAttrs(model, modelName);
    validateRelationships(model, modelName);
    validateRepeatedKeys(model, modelName);
  }
}

function validateModelExistance(model, modelName) {
  if (model === null || typeof model !== 'object') {
    throw makeError(modelName, `Expected model to be an object, found ${model}`);
  }
}

function validateTableName(model, modelName) {
  if (!('table' in model)) {
    throw makeError(modelName, `Expected property 'table' to exist`);
  }

  if (typeof model.table !== 'string') {
    throw makeError(modelName, `Expected property 'table' to be of type String`);
  }

  if (model.table.length === 0) {
    throw makeError(modelName, `Expected property 'table' to not be empty`);
  }
}

function validateIdKey(model, modelName) {
  if (!('idKey' in model)) {
    return;
  }

  if (typeof model.idKey !== 'string') {
    throw makeError(modelName, `Expected property 'idKey' be of type String`);
  }

  if (model.idKey.length === 0) {
    throw makeError(modelName, `Expected property 'idKey' to not be empty`);
  }
}

function validateAttrs(model, modelName) {
  if (!('attrs' in model)) {
    return;
  }

  if (!Array.isArray(model.attrs)) {
    throw makeError(modelName, `Expected 'attrs' property to be an array`);
  }

  for (const attr of model.attrs) {
    if (!['string', 'object'].includes(typeof attr) || attr === null) {
      throw makeError(modelName, `All items in attrs array must be either strings or objects, found ${typeof attr}`);
    }

    const key = typeof attr === 'string' ? attr : attr.key;

    if (typeof key !== 'string') {
      throw makeError(modelName, `Expected attr key name to be a string, found ${typeof attr}`);
    }

    if (typeof key === 'string' && key.length === 0) {
      throw makeError(modelName, `Expected attr key name to have length > 0`);
    }

    if (typeof attr === 'object') {
      const disallowedProps = Object.keys(attr).filter(prop => !ALLOWED_ATTR_PROPS.includes(prop));

      if (disallowedProps.length > 0) {
        const inflection = disallowedProps.length === 1 ? 'y' : 'ies';
        const areIs = disallowedProps.length === 1 ? 'is' : 'are';
        const list = disallowedProps.map(prop => `'${prop}'`).join(', ');
        throw makeError(modelName, `The propert${inflection} ${list} ${areIs} not allowed in attribute definition objects`);
      }

      // allow falsey values or functions
      if (attr.serialize && typeof attr.serialize !== 'function') {
        throw makeError(modelName, `Expected attr property 'serialize' to be either falsey or a function`);
      }

      if (attr.deserialize && typeof attr.deserialize !== 'function') {
        throw makeError(modelName, `Expected attr property 'deserialize' to be either falsey or a function`);
      }
    }
  }
}

function validateRelationships(model, modelName) {
  if (!('relationships' in model)) {
    return;
  }

  if (!Array.isArray(model.relationships)) {
    throw makeError(modelName, `Expected property 'relationships' to be an Array`);
  }

  for (const rel of model.relationships) {
    if (typeof rel !== 'object') {
      throw makeError(modelName, `Expected items in 'relationships' array to be objects, found ${typeof rel}`);
    }

    for (const prop of [ 'key', 'type' ]) {
      if (!(prop in rel)) {
        throw makeError(modelName, `Expected property '${prop}' in relationship object to exist`);
      }

      if (typeof rel[prop] !== 'string') {
        throw makeError(modelName, `Expected property '${prop}' in relationship object to be a string, found ${typeof rel[prop]}`);
      }

      if (rel[prop].length === 0) {
        throw makeError(modelName, `Expected property '${prop}' in relationship object have length > 0`);
      }
    }

    if ('via' in rel) {
      if (typeof rel.via !== 'object') {
        throw makeError(modelName, `Expected property 'via' to either be an object or not exist`);
      }

      for (const prop of ALLOWED_REL_VIA_PROPS) {
        if (!(prop in rel.via)) {
          throw makeError(modelName, `Expected property '${prop}' in relationship via object to exist`);
        }

        if (typeof rel.via[prop] !== 'string') {
          throw makeError(modelName, `Expected property '${prop}' in relationship via object to be a string, found ${typeof rel[prop]}`);
        }

        if (rel.via[prop].length === 0) {
          throw makeError(modelName, `Expected property '${prop}' in relationship via object have length > 0`);
        }
      }

      const disallowedViaProps = Object.keys(rel.via).filter(prop => !ALLOWED_REL_VIA_PROPS.includes(prop));

      if (disallowedViaProps.length > 0) {
        const inflection = disallowedViaProps.length === 1 ? 'y' : 'ies';
        const areIs = disallowedViaProps.length === 1 ? 'is' : 'are';
        const list = disallowedViaProps.map(prop => `'${prop}'`).join(', ');
        throw makeError(modelName, `The propert${inflection} ${list} ${areIs} not allowed in relationship via objects`);
      }
    }

    const disallowedProps = Object.keys(rel).filter(prop => !ALLOWED_REL_PROPS.includes(prop));

    if (disallowedProps.length > 0) {
      const inflection = disallowedProps.length === 1 ? 'y' : 'ies';
      const areIs = disallowedProps.length === 1 ? 'is' : 'are';
      const list = disallowedProps.map(prop => `'${prop}'`).join(', ');
      throw makeError(modelName, `The propert${inflection} ${list} ${areIs} not allowed in relationship objects`);
    }
  }
}

function validateRepeatedKeys(model, modelName) {
  const keys = [];

  // Don't include the idKey, as this is allowed to be repeated, usually in a one-to-one relationship

  if ('attrs' in model) {
    keys.push(...model.attrs.map(attr => typeof attr === 'string' ? attr : attr.key));
  }

  if ('relationships' in model) {
    keys.push(...model.relationships.map(rel => rel.key));
  }

  while (keys.length > 1) {
    const key = keys.pop();

    if (keys.includes(key)) {
      throw makeError(modelName, `Property name '${key}' is repeated`);
    }
  }
}

function makeError(modelName, msg) {
  return new Error(`Model Validation Error [${modelName}]: ${msg}.`);
}

module.exports = validateModels;
