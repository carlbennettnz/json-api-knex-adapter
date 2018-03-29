import { expect } from 'chai'

import Adapter from '../../src/knex-adapter'

describe('init', function() {
  // This is just checking that the validation helper is wired up correctly.
  // The actual validation is tested in test/unit/helpers/validate-models.js
  it('validates the models provided', function() {
    expect(() => new Adapter({ posts: null }, {}))
      .to.throw(`Model Validation Error [posts]: Expected model to be an object, found null.`);

    expect(() => new Adapter({ posts: {} }, {}))
      .to.throw(`Model Validation Error [posts]: Expected property 'table' to exist.`);
  });

  it('checks you provide a knex client', function() {
    expect(() => new Adapter({ posts: { table: 'post' } }, null))
      .to.throw(`A connected knex client is required.`);
  });

  it('works if you do everything right', function() {
    expect(() => new Adapter({ posts: { table: 'post' } }, {})).to.not.throw();
  });
});
