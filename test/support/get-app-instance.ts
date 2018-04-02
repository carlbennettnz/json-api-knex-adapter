import * as express from 'express'
import * as knex from 'knex'
import Adapter from '../../src/knex-adapter'

import {
  ResourceTypeRegistry,
  APIController,
  DocumentationController,
  Error as APIError,
  httpStrategies
} from 'json-api'
import { AdapterInstance } from 'json-api/build/src/db-adapters/AdapterInterface';
import KnexAdapter from '../../src/knex-adapter';
import { ResourceTypeDescription } from 'json-api/build/src/ResourceTypeRegistry';

const ExpressStrategy = httpStrategies.Express

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

export interface ExpressWithConn extends Express.Application {
  connection: knex
}

function getAppInstance(): ExpressWithConn {
  const app: ExpressWithConn = express();
  const conn = knex(dbConfig);

  app.connection = conn;

  (a: Express.Application) => app.route()

  const dbAdapter: AdapterInstance<typeof KnexAdapter> = new Adapter(models, conn);
  const defaults: ResourceTypeDescription = { dbAdapter };
  const registry = new ResourceTypeRegistry(resourceTypes, defaults);
  const controller = new APIController(registry);
  const docsController = new DocumentationController(new ResourceTypeRegistry({}), { name: 'Test API' });
  const Front = new ExpressStrategy(controller, docsController, { host: 'http://localhost:3000' });
  const handler = Front.apiRequest;

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
    Front.sendError(new APIError(404, undefined, 'Not found'), req, res, next);
  });

  app.use(function(err, req, res, next) {
    Front.sendError(err, req, res, next);
  });

  return app;
}

export default getAppInstance;
