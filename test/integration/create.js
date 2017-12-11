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
}, {
  type: 'posts',
  attributes: { title: 'Post 5', date: new Date('2017-10-15') },
  relationships: {
    author: { data: { id: '1', type: 'authors' } },
    tags: { data: [ { id: '1', type: 'tags' } ] }
  }
}];
const POSTS_WITH_BAD_AUTHOR = [ ...POSTS, {
  type: 'posts',
  relationships: { author: { data: { id: '999', type: 'authors' } } }
} ];

describe('integrated create', function() {
  let app, knex, db;

  before(() => app = getApp());
  before(() => knex = app.connection);
  before(() => db = dbHelpers(knex));
  beforeEach(() => db.clear());
  beforeEach(() => db.load());
  after(() => db.close());

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

    it('saves to-many relationships', async function() {
      const result = await request(app)
        .post('/posts')
        .type('application/vnd.api+json')
        .send({ data: POSTS[2] })
        .expect(201);

      expect(result.body.data.relationships.tags).to.exist;
      expect(result.body.data.relationships.tags.data).to.have.lengthOf(1);
    });

    it('does not return to-many relationship if value relationship is empty', async function() {
      const result = await request(app)
        .post('/posts')
        .type('application/vnd.api+json')
        .send({ data: { ...POSTS[2], relationships: { author: POSTS[2].relationships.author, tags: { data: [] } } } })
        .expect(201);

      expect(result.body.data.relationships.tags).to.not.exist;
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

    it('is atomic', async function() {
      const [ { count: pre } ] = await knex('post').count();

      await request(app)
        .post('/posts')
        .type('application/vnd.api+json')
        .send({ data: POSTS_WITH_BAD_AUTHOR })
        .expect(500);

      const [ { count: post } ] = await knex('post').count();

      expect(pre).equals(post);
    });
  });
});
