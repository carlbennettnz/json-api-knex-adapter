const getApp = require('../support/get-app-instance');
const dbHelpers = require('../support/database');
const request = require('supertest');
const { expect } = require('chai');

const OBJECT_ID_REGEX = /^[0-9a-f]{24}$/;

const POSTS = [{
  type: 'posts',
  attributes: { title: 'Post 5', date: new Date('2017-10-15') },
  relationships: { author: { data: { id: '000000000000000000000001', type: 'authors' } } }
}, {
  type: 'posts',
  attributes: { title: 'Post 6', date: new Date('2017-10-15') }
}, {
  type: 'posts',
  attributes: { title: 'Post 5', date: new Date('2017-10-15') },
  relationships: {
    author: { data: { id: '000000000000000000000001', type: 'authors' } },
    tags: { data: [ { id: '000000000000000000000001', type: 'tags' } ] }
  }
}];
const POSTS_WITH_BAD_AUTHOR = [ ...POSTS, {
  type: 'posts',
  relationships: { author: { data: { id: '000000000000000000000999', type: 'authors' } } }
} ];
const POST_WITH_COMMENTS = {
  type: 'posts',
  relationships: { comments: { data: [{ id: '000000000000000000000999', type: 'comments' }] } }
};

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

      const [ { count } ] = await knex('post').count();

      expect(count).to.equal('5');
    });

    it('returns the resources', async function() {
      const res = await request(app)
        .post('/posts')
        .type('application/vnd.api+json')
        .send({ data: POSTS[0] })
        .expect(201);

      expect(res.body.data.id).to.match(OBJECT_ID_REGEX);
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

    it('forbids the creation of a resource with a one-to-many relationship', async function() {
      const countPosts = () => knex('post').count().then(r => Number(r[0].count));

      const preCount = await countPosts();

      const result = await request(app)
        .post('/posts')
        .type('application/vnd.api+json')
        .send({ data: POST_WITH_COMMENTS })
        .expect(403);

      expect(result.body.errors).to.have.lengthOf(1);
      expect(result.body.errors[0].title).to.equal('Illegal update to one-to-many relationship');
      expect(result.body.errors[0].paths.pointer).to.equal('/data/0/relationships/comments');

      const postCount = await countPosts();

      expect(postCount).to.equal(preCount, 'no post added');
    });
  });

  describe('collections', function() {
    it('inserts the resources', async function() {
      await request(app)
        .post('/posts')
        .type('application/vnd.api+json')
        .send({ data: POSTS })
        .expect(201);

      const [ { count } ] = await knex('post').count();

      expect(count).to.equal('7');
    });

    it('returns the resources', async function() {
      const res = await request(app)
        .post('/posts')
        .type('application/vnd.api+json')
        .send({ data: POSTS })
        .expect(201);

      expect(res.body.data[0].id).to.match(OBJECT_ID_REGEX);
      expect(res.body.data[0].attributes.title).to.equal('Post 5');
      expect(res.body.data[0].attributes.date).to.exist;
      expect(res.body.data[0].relationships.author).to.exist;

      expect(res.body.data[1].id).to.match(OBJECT_ID_REGEX);
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
