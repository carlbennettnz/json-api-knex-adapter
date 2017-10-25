# Resapi Postgres

A database adapter.

## How to Use

```js
// index.js
const { ResourceTypeRegistry, ResourceController } = require('resapi');
const PostgresAdapter = require('resapi-postgres');
const express = require('express');
const knex = require('knex');
const models = require('./models');

const connection = knex(config);
const dbAdapter = new PostgresAdapter(models, connection);

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
          on: 'favouritePost',
          aggregating: '_id'
        }
      },

      // Linked to-one relationships are not currently supported
    ]
  }
}
```

## Tests

There are plenty of tests written, but current the integration tests won't work unless you have your database configure exactly the way mine is. I'm working on a knex migration that will automatically everything up.
