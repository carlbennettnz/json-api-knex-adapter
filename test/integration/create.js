const getApp = require('../support/get-app-instance');
const dbHelpers = require('../support/database');
const request = require('supertest');
const { expect } = require('chai');

const POSTS = [{
  type: 'posts',
  attributes: { title: 'Post 5', date: new Date('2017-10-15') },
  relationships: { author: { data: { id: '1', type: 'authors' } } }
}, {
  type: 'posts',
  attributes: { title: 'Post 6', date: new Date('2017-10-15') }
}];

describe('integrated create', function() {
  let app, db;

  before(() => app = getApp());
  before(() => knex = app.connection);
  before(() => db = dbHelpers(knex));
  beforeEach(() => db.clear());
  beforeEach(() => db.load());
  after(() => db.close());

/*
  describe('collections', function() {
    it('uses types correctly', async function() {
      const res = await request(app)
        .get('/posts')
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data).to.have.lengthOf(4);

      for (const r of res.body.data) {
        expect(r.type).to.equal('posts');
      }
    });

    it('filters fields', async function() {
      const res = await request(app)
        .get('/posts')
        .query({ fields: { posts: 'title' } })
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data).to.have.lengthOf(4);

      for (const r of res.body.data) {
        expect(r.attributes.title).to.exist;
        expect(r.attributes.date).to.not.exist;
      }
    });

    it('applies sorts', async function() {
      const res = await request(app)
        .get('/posts')
        .query({ sort: '-title,id' })
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data).to.have.lengthOf(4);

      expect(res.body.data[0].id).to.equal('3');
      expect(res.body.data[1].id).to.equal('4');
      expect(res.body.data[2].id).to.equal('2');
      expect(res.body.data[3].id).to.equal('1');
    });

    it.skip('applies filters', async function() {
      const res = await request(app)
        .get('/posts')
        .query('filter[title]', 'Post 1')
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data).to.have.lengthOf(1);

      expect(res.body.data[0].attributes.title).to.equal('Post 1');
    });

    it.skip('populates relationships with include', async function() {
      const res = await request(app)
        .get('/posts')
        .query('include', 'author')
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data).to.have.lengthOf(4);
      expect(res.body.included).to.have.lengthOf(1);

      expect(res.body.included[0].attributes.id).to.equal('1');
    });
  });
*/

  describe('single resources', function() {
    it('inserts the resource', async function() {
      await request(app)
        .post('/posts')
        .type('application/vnd.api+json')
        .send({ data: POSTS[0] })
        .expect(201);

      const [ post ] = await knex('post').where('_id', '=', 5);

      expect(post).to.exist;
      expect(post.title).to.equal('Post 5');
      expect(post.author).to.equal(1);
    });

    it('returns the resources', async function() {
      const res = await request(app)
        .post('/posts')
        .type('application/vnd.api+json')
        .send({ data: POSTS[0] })
        .expect(201);

      expect(res.body.data.id).to.equal('5');
      expect(res.body.data.attributes.title).to.equal('Post 5');
      expect(res.body.data.attributes.date).to.exist;
      expect(res.body.data.relationships.author).to.exist;
    });

    it('ignores surplus fields', async function() {
      await request(app)
        .post('/posts')
        .type('application/vnd.api+json')
        .send({ data: { ...POSTS[0], abc: 123 } })
        .expect(201);
    });
  });

  describe('collections', function() {
    it('inserts the resources', async function() {
      await request(app)
        .post('/posts')
        .type('application/vnd.api+json')
        .send({ data: POSTS })
        .expect(201);

      const [ post1, post2 ] = await knex('post').where('_id', '>=', 5).orderBy('_id');

      expect(post1).to.exist;
      expect(post1.title).to.equal('Post 5');
      expect(post1.author).to.equal(1);

      expect(post2).to.exist;
      expect(post2.title).to.equal('Post 6');
      expect(post2.author).to.equal(null);
    });

    it('returns the resources', async function() {
      const res = await request(app)
        .post('/posts')
        .type('application/vnd.api+json')
        .send({ data: POSTS })
        .expect(201);

      expect(res.body.data[0].id).to.equal('5');
      expect(res.body.data[0].attributes.title).to.equal('Post 5');
      expect(res.body.data[0].attributes.date).to.exist;
      expect(res.body.data[0].relationships.author).to.exist;

      expect(res.body.data[1].id).to.equal('6');
      expect(res.body.data[1].attributes.title).to.equal('Post 6');
      expect(res.body.data[1].attributes.date).to.exist;
      expect(res.body.data[1].relationships).to.not.exist;
    });

    it('ignores surplus fields', async function() {
      await request(app)
        .post('/posts')
        .type('application/vnd.api+json')
        .send({ data: POSTS.map(p => ({ ...p, abc: 123 })) })
        .expect(201);
    });
  });
});
