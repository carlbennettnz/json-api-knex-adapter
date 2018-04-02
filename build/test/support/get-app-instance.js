"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const knex = require("knex");
const knex_adapter_1 = require("../../src/knex-adapter");
const json_api_1 = require("json-api");
const ExpressStrategy = json_api_1.httpStrategies.Express;
const models = {
    posts: {
        table: 'post',
        idKey: '_id',
        attrs: ['title', 'date'],
        relationships: [
            { type: 'authors', key: 'author' },
            { type: 'tags', key: 'tags', via: { table: 'post_tag', fk: 'post', pk: 'tag' } },
            { type: 'comments', key: 'comments', via: { table: 'comment', fk: 'post', pk: '_id' } }
        ]
    },
    authors: {
        table: 'author',
        idKey: '_id',
        attrs: ['name'],
        relationships: [
            { type: 'posts', key: 'posts', via: { table: 'posts', pk: '_id', fk: 'author' } }
        ]
    },
    tags: {
        table: 'tag',
        idKey: '_id',
        attrs: ['name'],
        relationships: []
    },
    comments: {
        table: 'comment',
        idKey: '_id',
        attrs: ['content'],
        relationships: [{ key: 'post', type: 'posts' }]
    },
    awards: {
        table: 'award',
        idKey: '_id',
        attrs: ['name'],
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
    (a) => app.route();
    const dbAdapter = new knex_adapter_1.default(models, conn);
    const defaults = { dbAdapter };
    const registry = new json_api_1.ResourceTypeRegistry(resourceTypes, defaults);
    const controller = new json_api_1.APIController(registry);
    const docsController = new json_api_1.DocumentationController(new json_api_1.ResourceTypeRegistry({}), { name: 'Test API' });
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
    app.use(function (req, res, next) {
        Front.sendError(new json_api_1.Error(404, undefined, 'Not found'), req, res, next);
    });
    app.use(function (err, req, res, next) {
        Front.sendError(err, req, res, next);
    });
    return app;
}
exports.default = getAppInstance;
