const { expect } = require('chai');
const PostgresAdapter = require('../../src/postgres-adapter');
const normalizeModels = require('../../src/helpers/normalize-models');
const td = require('testdouble');
const {
  Error: APIError
} = require('resapi').types;

const models = normalizeModels({
  posts: {
    table: 'post',
    idKey: '_id',
    attrs: [ 'title' ],
    relationships: [ { type: 'authors', key: 'author' } ]
  }
});

const knex = td.object();
const adapter = new PostgresAdapter(models, knex);

describe('delete', function() {
  afterEach(td.reset);

  it('single resource, deleted', async function() {
    td.when(knex.from('post')).thenReturn(knex);
    td.when(knex.whereIn('_id', [ '1' ])).thenReturn(knex);
    td.when(knex.delete()).thenResolve(1);

    const result = await adapter.delete('posts', '1');

    expect(result).to.be.undefined;
  });

  it('single resource, not found', async function() {
    td.when(knex.from('post')).thenReturn(knex);
    td.when(knex.whereIn('_id', [ '1' ])).thenReturn(knex);
    td.when(knex.delete()).thenResolve(0);

    try {
      await adapter.delete('posts', '1');
    } catch (err) {
      expect(err).to.be.an.instanceOf(APIError);
      expect(err.title).to.equal('No matching resource found');
      return;
    }

    throw new Error('Expected no matched resources to cause operation to reject with APIError');
  });

  it('multiple resources, partially deleted', async function() {
    td.when(knex.from('post')).thenReturn(knex);
    td.when(knex.whereIn('_id', [ '1', '2' ])).thenReturn(knex);
    td.when(knex.delete()).thenResolve(1);

    const result = await adapter.delete('posts', [ '1', '2' ]);

    expect(result).to.be.undefined;
  });

  it('multiple resources, not found', async function() {
    td.when(knex.from('post')).thenReturn(knex);
    td.when(knex.whereIn('_id', [ '1', '2' ])).thenReturn(knex);
    td.when(knex.delete()).thenResolve(0);

    const result = await adapter.delete('posts', [ '1', '2' ]);

    expect(result).to.be.undefined;
  });
});
