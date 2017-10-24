const { expect } = require('chai');
const PostgresAdapter = require('../../src/postgres-adapter');
const td = require('testdouble');
const realKnex = require('knex')({ client: 'pg' });
const {
  Collection,
  Resource,
  Linkage,
  Relationship,
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

const knex = td.object(realKnex('post'));

const POSTS = [
  { _id: 1, title: 'Post 1', author: 1 },
  { _id: 2, title: 'Post 2', author: 1 }
];

const adapter = new PostgresAdapter(models, knex);

describe('find', function() {
  afterEach(td.reset);

  it('uses the correct basic structure', async function() {
    td.when(knex.from('post')).thenReturn(knex);
    td.when(knex.select('post.*')).thenResolve(POSTS);

    const [ primary, included ] = await adapter.find('posts', null, null, null, null, null);

    expect(primary).to.be.instanceOf(Collection);
    expect(primary.resources).to.have.lengthOf(2);

    primary.resources.forEach(r => {
      expect(r).to.be.an.instanceOf(Resource);
      expect(r.id).to.a('string');

      expect(Object.keys(r.attrs)).to.have.lengthOf(1);
      expect(r.attrs.title).to.be.a('string');

      expect(Object.keys(r.relationships)).to.have.lengthOf(1);

      const rel = r.relationships.author;
      expect(rel).to.be.instanceOf(Relationship);
      expect(rel.linkage).to.be.instanceOf(Linkage);
      expect(rel.linkage.value.type).to.equal('authors');
      expect(rel.linkage.value.id).to.be.a('string');
    });

    expect(included).to.be.instanceOf(Collection);
    expect(included.resources).to.have.lengthOf(0);
  });

  it('finds all resources of type', async function() {
    td.when(knex.from('post')).thenReturn(knex);
    td.when(knex.select('post.*')).thenResolve(POSTS);

    const [ primary, included ] = await adapter.find('posts', null, null, null, null, null);

    expect(primary.resources).to.have.lengthOf(2);

    primary.resources.forEach((r, i) => {
      expect(r.id).to.equal((i + 1).toString());
      expect(r.attrs.title).to.equal(`Post ${i + 1}`);
      expect(r.relationships.author.linkage.value.id).to.equal('1');
    });

    expect(included.resources).to.have.lengthOf(0);
  });

  it('filters by id array', async function() {
    td.when(knex.from('post')).thenReturn(knex);
    td.when(knex.whereIn('_id', ['1', '2'])).thenReturn(knex);
    td.when(knex.select('post.*')).thenResolve(POSTS);

    const [ primary, included ] = await adapter.find('posts', ['1', '2'], null, null, null, null);

    expect(primary.resources).to.have.lengthOf(2);

    primary.resources.forEach((r, i) => {
      expect(r.id).to.equal((i + 1).toString());
      expect(r.attrs.title).to.equal(`Post ${i + 1}`);
      expect(r.relationships.author.linkage.value.id).to.equal('1');
    });

    expect(included.resources).to.have.lengthOf(0);
  });

  it('finds a specific id', async function() {
    td.when(knex.from('post')).thenReturn(knex);
    td.when(knex.where('_id', '1')).thenReturn(knex);
    td.when(knex.select('post.*')).thenResolve(POSTS.slice(0, 1));

    const [ primary, included ] = await adapter.find('posts', '1', null, null, null, null);

    expect(primary).to.be.an.instanceOf(Resource);
    expect(primary.id).to.equal('1');
    expect(primary.attrs.title).to.equal(`Post 1`);
    expect(primary.relationships.author.linkage.value.id).to.equal('1');

    expect(included.resources).to.have.lengthOf(0);
  });

  it('returns a sparse fieldset on the primary resource', async function() {
    td.when(knex.from('post')).thenReturn(knex);
    td.when(knex.select([ 'title', '_id' ])).thenResolve(POSTS);

    const [ primary, included ] = await adapter.find('posts', null, { posts: [ 'title' ] }, null, null, null);

    expect(primary.resources).to.have.lengthOf(2);

    primary.resources.forEach((r, i) => {
      expect(r.id).to.equal((i + 1).toString());
      expect(r.attrs.title).to.exist;
      expect(r.attrs.date).to.not.exist;
      expect(r.relationships.author).to.not.exist;
    });

    expect(included.resources).to.have.lengthOf(0);
  });

  it(`returns a sparse fieldset on the primary resource's relationships`, async function() {
    td.when(knex.from('post')).thenReturn(knex);
    td.when(knex.select([ 'author', '_id' ])).thenResolve(POSTS.map(p => ({ _id: p._id, author: p.author })));

    const [ primary, included ] = await adapter.find('posts', null, { posts: [ 'author' ] }, null, null, null);

    expect(primary.resources).to.have.lengthOf(2);

    primary.resources.forEach((r, i) => {
      expect(r.id).to.equal((i + 1).toString());
      expect(r.attrs.title).to.not.exist;
      expect(r.attrs.date).to.not.exist;
      expect(r.relationships.author).to.exist;
      expect(r.relationships.author.linkage.value.id).to.exist;
    });

    expect(included.resources).to.have.lengthOf(0);
  });

  it.skip('returns a sparse fieldset on the included resource', async function() {
    td.when(knex.from('post')).thenReturn(knex);
    td.when(knex.select([ 'title' ])).thenResolve(POSTS);

    const [ primary, included ] = await adapter.find('posts', null, { author: [ 'name' ] }, null, null, [ 'author' ]);

    expect(primary.resources).to.have.lengthOf(2);

    primary.resources.forEach((r, i) => {
      expect(r.id).to.equal((i + 1).toString());
      expect(r.attrs.title).to.equal(`Post ${i + 1}`);
      expect(r.relationships.author.linkage.value.id).to.equal('1');
    });

    expect(included.resources).to.have.lengthOf(1);

    expect(included[0].type).to.equal('author');
    expect(included[0].id).to.equal('1');
    expect(included[0].attrs).to.have.key('name');
    expect(included[0].attrs).to.not.have.key('age');
  });

  it('sorts the results', async function() {
    td.when(knex.from('post')).thenReturn(knex);
    td.when(knex.select('post.*')).thenReturn(knex);
    td.when(knex.orderBy('_id', 'desc')).thenResolve([ POSTS[1], POSTS[0] ]);

    const [ primary, included ] = await adapter.find('posts', null, null, [ '-id' ], null, null);

    expect(primary.resources).to.have.lengthOf(2);

    expect(primary.resources[0].id).to.equal('2');
    expect(primary.resources[1].id).to.equal('1');

    expect(included.resources).to.have.lengthOf(0);
  });

  it(`throws on sorts of attrs that aren't in the model`, async function() {
    td.when(knex.from('post')).thenReturn(knex);
    td.when(knex.select('post.*')).thenResolve(POSTS);

    try {
      await adapter.find('posts', null, null, [ 'password' ], null, null);
    } catch (err) {
      expect(err).to.have.lengthOf(1);
      expect(err[0]).to.be.an.instanceOf(APIError);
      expect(err[0].detail).to.include(`'password' does not exist`);
      return;
    }

    throw new Error('Expected bad sort to cause promise rejection');
  });

  it('applies all sorts in order', async function() {
    td.when(knex.from('post')).thenReturn(knex);
    td.when(knex.select('post.*')).thenReturn(knex);
    td.when(knex.orderBy('title', 'asc')).thenReturn(knex);
    td.when(knex.orderBy('_id', 'desc')).thenResolve(POSTS);

    const [ primary, included ] = await adapter.find('posts', null, null, [ 'title', '-id' ], null, null);

    expect(primary.resources).to.have.lengthOf(2);

    expect(primary.resources[0].id).to.equal('1');
    expect(primary.resources[1].id).to.equal('2');

    expect(included.resources).to.have.lengthOf(0);
  });

  it('applies filters', async function() {
    const date = new Date('2017-06-01');

    td.when(knex.from('post')).thenReturn(knex);
    td.when(knex.where('title', '=', 'Post 1')).thenReturn(knex);
    td.when(knex.where('date', '<', td.matchers.argThat(d => d.valueOf() === date.valueOf()))).thenReturn(knex);
    td.when(knex.select('post.*')).thenResolve(POSTS.slice(0, 1));

    const [ primary, included ] = await adapter.find('posts', null, null, null, { title: 'Post 1', date: { $lt: date } }, null);

    expect(primary.resources).to.have.lengthOf(1);
    expect(primary.resources[0].id).to.equal('1');
    expect(included.resources).to.have.lengthOf(0);
  });

  it('gives a nice error for non-object filters', async function() {
    td.when(knex.from('post')).thenReturn(knex);
    td.when(knex.select('post.*')).thenResolve(POSTS);

    try {
      await adapter.find('posts', null, null, null, 'abc', null);
    } catch (err) {
      expect(err.title).to.equal('Bad filter');
      expect(err.detail).to.equal('Filters must be an object.');
      return;
    }

    throw new Error('Expected bad filter to cause promise rejection');
  });

  it('gives a nice error for top-level operators', async function() {
    td.when(knex.from('post')).thenReturn(knex);
    td.when(knex.select('post.*')).thenResolve(POSTS);

    try {
      await adapter.find('posts', null, null, null, { $or: [ { title: 'Post 1' }, { title: 'Post 2' } ] }, null);
    } catch (err) {
      expect(err.title).to.equal('Bad filter');
      expect(err.detail).to.equal('Expected to find an attribute name, got $or. Logical operators are not supported.');
      return;
    }

    throw new Error('Expected bad filter to cause promise rejection');
  });

  it('gives a nice error for unknown operators', async function() {
    td.when(knex.from('post')).thenReturn(knex);
    td.when(knex.select('post.*')).thenResolve(POSTS);

    try {
      await adapter.find('posts', null, null, null, { title: { '<': 1 } }, null);
    } catch (err) {
      expect(err.title).to.equal('Bad filter');
      expect(err.detail).to.equal('Unknown operator <.');
      return;
    }

    throw new Error('Expected bad filter to cause promise rejection');
  });

  it.skip('includes resources');
});
