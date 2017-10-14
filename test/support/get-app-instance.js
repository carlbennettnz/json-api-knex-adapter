const express = require('express');
const knex = require('knex');
const PostgresAdapter = require('../../src/postgres-adapter');

const {
  ResourceTypeRegistry,
  ResourceController,
  types: { APIError }
} = require('resapi');

const models = {
  posts: {
    table: 'post',
    idKey: '_id',
    attrs: [ 'title', 'date' ],
    relationships: [ { type: 'authors', key: 'author' } ]
  },

  authors: {
    table: 'author',
    idKey: '_id',
    attrs: [ 'name' ],
    relationships: []
  }
};

const resourceTypes = {
  posts: {
    urlTemplates: {
      self: 'http://localhost:3000/posts/{id}',
      relationship: 'http://localhost:3000/posts/{ownerId}/relationships/{path}'
    }
  },

  authors: {
    urlTemplates: {
      self: 'http://localhost:3000/authors/{id}',
      relationship: 'http://localhost:3000/authors/{ownerId}/relationships/{path}'
    }
  }
};

const dbConfig = {
  client: 'pg',
  connection: {
    database: 'resapi_postgres_test'
  }
};

function getAppInstance() {
  const app = express();
  const conn = knex(dbConfig);

  app.connection = conn;

  const dbAdapter = new PostgresAdapter(models, conn);
  const registry = new ResourceTypeRegistry(resourceTypes, { dbAdapter });
  const resourceController = new ResourceController(registry);
  const handler = resourceController.handle.bind(resourceController);

  app.route('/:type(posts)')
    .all(handler);

  app.route('/:type(posts)/:id')
    .get(handler)
    .patch(handler)
    .delete(handler);

  app.route('/:type(posts)/:id/:related')
    .get(handler);

  app.route('/:type(posts)/:id/relationships/:relationship')
    .get(handler)
    .post(handler)
    .patch(handler);

  app.use(function(req, res, next) {
    resourceController.sendError(new APIError(404, undefined, 'Not found'), req, res);
  });

  app.use(function(err, req, res, next) {
    resourceController.sendError(err, req, res);
  });

  return app;
}

module.exports = getAppInstance;
