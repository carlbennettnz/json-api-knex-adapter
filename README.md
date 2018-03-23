# `json-api-knex-adapter`

Serve resources from your SQL database using [`json-api`](https://github.com/ethanresnick/json-api/tree/v3-evolution-over-rewrite).

## How to Use

```js
// index.js
const { ResourceTypeRegistry, ResourceController } = require('jsonapi');
const KnexAdapter = require('json-api-knex-adapter');
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
      },

      // Linked to-one relationships are not currently supported
    ]
  }
}
```

## Future Plans

* **Infer models at runtime from the database structure.** Most of the data that currently needs to be passed in is unnecessary. A simple list of tables and to-many relationships to expose is all that I can think of that would still be needed.
* **Refactor the helpers folder**. It was originally supposed to be a small set of utility funcations, but a decent chuck of the logic is now in there.
* **Generalize for public use.** There are a few things in here that are specific to us/Postgres. They should be removed or at least documented.
* **Get it working with JSON API v3**. Shouldn't be much work. The API is the same AFAIK.
