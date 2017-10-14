const { expect } = require('chai');
const PostgresAdapter = require('../../src/postgres-adapter');
const td = require('testdouble');
const realKnex = require('knex')({ client: 'pg' });
const { recordsToCollection, recordToResource } = require('../../src/helpers/result-types');
const {
  Collection,
  Resource,
  Linkage,
  Error: APIError
} = require('resapi').types;

const models = {
  posts: {
    table: 'post',
    idKey: '_id',
    attrs: [ 'title' ],
    relationships: [ { type: 'authors', key: 'author' } ]
  }
};

const knex = td.object({ transaction: realKnex.transaction });
const POSTS = recordsToCollection([ { title: 'Post 1', author: 1 }, { title: 'Post 2', author: 1 } ], 'posts', models);
const POSTS_WITH_IDS = recordsToCollection([ { _id: 1, title: 'Post 1', author: 1 }, { _id: 2, title: 'Post 2', author: 1 } ], 'posts', models);
const adapter = new PostgresAdapter(models, knex);

describe('create', function() {
  afterEach(td.reset);

  it('single resource', async function() {
    td.when(knex.transaction(td.matchers.isA(Function))).thenDo(cb => {
      const trx = td.object();

      td.when(trx.insert(td.matchers.anything())).thenReturn(trx);
      td.when(trx.into('post')).thenReturn(trx);
      td.when(trx.returning('id')).thenResolve([ 1 ]);

      return cb(trx).then(() => POSTS_WITH_IDS.resources.slice(0, 1));
    });

    const result = await adapter.create('posts', POSTS.resources[0]);

    expect(result).to.be.an.instanceOf(Resource);
    expect(result.id).to.a('string');
    expect(result.id).to.equal('1');

    expect(Object.keys(result.attrs)).to.have.lengthOf(1);
    expect(result.attrs.title).to.be.a('string');
    expect(result.attrs.title).to.equal('Post 1');

    expect(Object.keys(result.relationships)).to.have.lengthOf(1);

    const linkage = result.relationships.author;
    expect(linkage).to.be.instanceOf(Linkage);
    expect(linkage.value.type).to.equal('authors');
    expect(linkage.value.id).to.be.a('string');
    expect(linkage.value.id).to.equal('1');
  });

  it('collection of resources of same type', async function() {
    td.when(knex.transaction(td.matchers.isA(Function))).thenDo(cb => {
      const trx = td.object();

      td.when(trx.insert(td.matchers.anything())).thenReturn(trx);
      td.when(trx.into('post')).thenReturn(trx);
      td.when(trx.returning('id')).thenResolve([ 1, 2 ]);

      return cb(trx).then(() => POSTS_WITH_IDS.resources);
    });

    const result = await adapter.create('posts', POSTS);

    expect(result).to.be.instanceOf(Collection);
    expect(result.resources).to.have.lengthOf(2);

    result.resources.forEach((r, i) => {
      expect(r).to.be.an.instanceOf(Resource);
      expect(r.id).to.a('string');
      expect(r.id).to.equal((i+1).toString());

      expect(Object.keys(r.attrs)).to.have.lengthOf(1);
      expect(r.attrs.title).to.be.a('string');
      expect(r.attrs.title).to.equal(`Post ${i+1}`);

      expect(Object.keys(r.relationships)).to.have.lengthOf(1);

      const linkage = r.relationships.author;
      expect(linkage).to.be.instanceOf(Linkage);
      expect(linkage.value.type).to.equal('authors');
      expect(linkage.value.id).to.be.a('string');
      expect(linkage.value.id).to.equal('1');
    });
  });
});
