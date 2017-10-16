const { expect } = require('chai');
const PostgresAdapter = require('../../src/postgres-adapter');
const td = require('testdouble');
const realKnex = require('knex')({ client: 'pg' });
const { recordsToCollection } = require('../../src/helpers/result-types');
const {
  Collection,
  Resource,
  Linkage,
  Relationship
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
const POSTS_WITH_IDS = recordsToCollection(
  [ { _id: 1, title: 'Post 1', author: 1 }, { _id: 2, title: 'Post 2', author: 1 } ],
  'posts',
  models.posts
);
const adapter = new PostgresAdapter(models, knex);

describe('update', function() {
  afterEach(td.reset);

  it('single resource', async function() {
    td.when(knex.transaction(td.matchers.isA(Function))).thenDo(cb => {
      const trx = td.function();
      const qb = td.object();

      td.when(trx('post')).thenReturn(qb);
      td.when(qb.where('_id', '=', '1')).thenReturn(qb);
      td.when(qb.update({ title: 'Post 1', author: '1' })).thenReturn(qb);
      td.when(qb.returning('*')).thenResolve({ _id: 1, title: 'Post 1', author: 1, date: new Date() });

      return cb(trx);
    });

    const result = await adapter.update('posts', POSTS_WITH_IDS.resources[0]);

    expect(result).to.be.an.instanceOf(Resource);
    expect(result.id).to.a('string');
    expect(result.id).to.equal('1');

    expect(Object.keys(result.attrs)).to.have.lengthOf(1);
    expect(result.attrs.title).to.be.a('string');
    expect(result.attrs.title).to.equal('Post 1');

    expect(Object.keys(result.relationships)).to.have.lengthOf(1);

    const rel = result.relationships.author;
    expect(rel).to.be.instanceOf(Relationship);
    expect(rel.linkage).to.be.instanceOf(Linkage);
    expect(rel.linkage.value.type).to.equal('authors');
    expect(rel.linkage.value.id).to.be.a('string');
    expect(rel.linkage.value.id).to.equal('1');
  });

  it('collection of resources of same type', async function() {
    td.when(knex.transaction(td.matchers.isA(Function))).thenDo(cb => {
      const trx = td.function();
      const qb = td.object();

      td.when(trx('post')).thenReturn(qb);
      td.when(qb.where('_id', '=', '1')).thenReturn(qb);
      td.when(qb.where('_id', '=', '2')).thenReturn(qb);
      td.when(qb.update({ title: 'Post 1', author: '1' })).thenReturn(qb);
      td.when(qb.update({ title: 'Post 2', author: '1' })).thenReturn(qb);
      td.when(qb.returning('*')).thenResolve(
        { _id: 1, title: 'Post 1', author: 1, date: new Date() },
        { _id: 2, title: 'Post 2', author: 1, date: new Date() }
      );

      return cb(trx);
    });

    const result = await adapter.update('posts', POSTS_WITH_IDS);

    expect(result).to.be.instanceOf(Collection);
    expect(result.resources).to.have.lengthOf(2);

    result.resources.forEach((r, i) => {
      expect(r).to.be.an.instanceOf(Resource);
      expect(r.id).to.a('string');
      expect(r.id).to.equal((i + 1).toString());

      expect(Object.keys(r.attrs)).to.have.lengthOf(1);
      expect(r.attrs.title).to.be.a('string');
      expect(r.attrs.title).to.equal(`Post ${i + 1}`);

      expect(Object.keys(r.relationships)).to.have.lengthOf(1);

      const rel = r.relationships.author;
      expect(rel).to.be.instanceOf(Relationship);
      expect(rel.linkage).to.be.instanceOf(Linkage);
      expect(rel.linkage.value.type).to.equal('authors');
      expect(rel.linkage.value.id).to.be.a('string');
      expect(rel.linkage.value.id).to.equal('1');
    });
  });

  it.skip('errors on surplus fields');
  it.skip('gives nice validation errors');
  it.skip('is atomic');
});
