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
const dbAdapter = new KnexAdapter(models, connection);

const registry = new ResourceTypeRegistry(resourceTypes, { dbAdapter });
const resourceController = new ResourceController(registry);
const handler = resourceController.handle.bind(resourceController);

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
