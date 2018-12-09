# `@json-api/knex-adapter`

Serve resources from your SQL database using [`json-api@3`](https://github.com/ethanresnick/json-api).

## Installation

```
npm i --save json-api@latest @json-api/knex-adapter
```

## How to Use

```js
// index.js
const { ResourceTypeRegistry, ResourceController } = require('json-api');
const KnexAdapter = require('@json-api/knex-adapter');
const express = require('express');
const knex = require('knex');
const models = require('./models');

const connection = knex(config);
const dbAdapter = new Adapter(models, connection);

const defaults: ResourceTypeDescription = { dbAdapter, urlTemplates };
const registry = new ResourceTypeRegistry(resourceTypes, defaults);
const controller = new APIController(registry);

// This library doesn't yet support reflection of model data for documentation, but json-api requires
// that we provide a DocumentationController regardless. The solution for now is to provide a
// fake controller with an empty ResourceTypeRegistery.
const docsController = new DocumentationController(new ResourceTypeRegistry({}), { name: 'My API' });

const Front = new ExpressStrategy(controller, docsController, { host: 'http://localhost:3000' });
const handler = Front.apiRequest;

const app = express();

app.get('/:type', handler);

app.listen(3000);
```

```js
// models.js
module.exports = {
  posts: {
    table: 'post',
    idKey: '_id',
    attrs: [ 'title', 'date' ],
    relationships: [
      // Direct many-to-one relationship, with the foreign key stored in this resource's row.
      {
        type: 'authors',
        key: 'author'
      },

      // Linked many-to-many relationship, with the foreign keys stored in a linking table.
      {
        type: 'tags',
        key: 'tags',
        via: {
          table: 'post_tag',
          fk: 'post',
          pk: 'tag'
        }
      },

      // Linked one-to-many relationship, with the foreign keys stored in a normal table.
      {
        type: 'readers',
        key: 'favouriteOf',
        via: {
          table: 'reader',
          fk: 'favouritePost',
          pk: '_id'
        }
      }
    ]
  }
}
```
