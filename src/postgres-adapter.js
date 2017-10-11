
module.exports = class PostgresAdapter {
  find(type, idOrIds, fields, sorts, filters, includePaths) {
    throw new Error('Not implemented');
  }

  create(parentType, resourceOrCollection) {
    throw new Error('Not implemented');
  }

  update(parentType, resourceOrCollection) {
    throw new Error('Not implemented');
  }

  delete(parentType, idsOrIds) {
    throw new Error('Not implemented');
  }

  addToRelationship(type, id, relationshipPath, newLinkage) {
    throw new Error('Not implemented');
  }

  removeFromRelationship(type, id, relationshipPath, linkageToRemove) {
    throw new Error('Not implemented');
  }

  getModel(modelName) {
    throw new Error('Not implemented');
  }

  getTypesAllowedInCollection(parentType) {
    throw new Error('Not implemented');
  }

  getRelationshipNames(type) {
    throw new Error('Not implemented');
  }

  static getModelName(type) {
    throw new Error('Not implemented');
  }
}