const express = require('express');
const knex = require('knex');
const PostgresAdapter = require('../../src/knex-adapter');

const {
  ResourceTypeRegistry,
  ResourceController,
  types: { APIError }
} = require('json-api');

const models = {
  posts: {
    table: 'post',
    idKey: '_id',
    attrs: [ 'title', 'date' ],
    relationships: [
      { type: 'authors', key: 'author' },
      { type: 'tags', key: 'tags', via: { table: 'post_tag', fk: 'post', pk: 'tag' } },
      { type: 'comments', key: 'comments', via: { table: 'comment', fk: 'post', pk: '_id' } }
    ]
  },

  authors: {
    table: 'author',
    idKey: '_id',
    attrs: [ 'name' ],
    relationships: [
      { type: 'posts', key: 'posts', via: { table: 'posts', pk: '_id', fk: 'author' } }
    ]
  },

  tags: {
    table: 'tag',
    idKey: '_id',
    attrs: [ 'name' ],
    relationships: []
  },

  comments: {
    table: 'comment',
    idKey: '_id',
    attrs: [ 'content' ],
    relationships: [ { key: 'post', type: 'posts' } ]
  },

  awards: {
    table: 'award',
    idKey: '_id',
    attrs: [ 'name' ],
    relationships: [
      { type: 'authors', key: 'winner' },
      { type: 'authors', key: 'runnerUp' },
      { type: 'tags', key: 'winnerTags', via: { table: 'award_winner_tag', fk: 'award', pk: 'tag' } },
      { type: 'tags', key: 'runnerUpTags', via: { table: 'award_runner_up_tag', fk: 'award', pk: 'tag' } }
    ]
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
  },

  tags: {
    urlTemplates: {
      self: 'http://localhost:3000/tags/{id}',
      relationship: 'http://localhost:3000/tags/{ownerId}/relationships/{path}'
    }
  },

  awards: {
    urlTemplates: {
      self: 'http://localhost:3000/awards/{id}',
      relationship: 'http://localhost:3000/awards/{ownerId}/relationships/{path}'
    }
  }
};

const dbConfig = {
  client: 'pg',
  connection: {
    database: 'resapi_knex_test'
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

  const typeParam = `:type(${Object.keys(resourceTypes).join('|')})`;

  app.route(`/${typeParam}`)
    .all(handler);

  app.route(`/${typeParam}/:id`)
    .get(handler)
    .patch(handler)
    .delete(handler);

  app.route(`/${typeParam}/:id/:related`)
    .get(handler);

  app.route(`/${typeParam}/:id/relationships/:relationship`)
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
