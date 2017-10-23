const getApp = require('../support/get-app-instance');
const dbHelpers = require('../support/database');
const request = require('supertest');
const { expect } = require('chai');

const POSTS = [{
  id: '1',
  type: 'posts',
  attributes: { title: 'New Title 1' },
  relationships: { author: { data: null } }
}, {
  id: '2',
  type: 'posts',
  attributes: { title: 'New Title 2', date: new Date('2017-10-15') }
}];
const POSTS_WITH_BAD_AUTHOR = [ ...POSTS, {
  id: '3',
  type: 'posts',
  relationships: { author: { data: { id: '999', type: 'authors' } } }
} ];

describe('integrated update', function() {
  let app, db;

  before(() => app = getApp());
  before(() => knex = app.connection);
  before(() => db = dbHelpers(knex));
  beforeEach(() => db.clear());
  beforeEach(() => db.load());
  after(() => db.close());

  describe('single resources', function() {
    it('updates the resource', async function() {
      const [ postBefore ] = await knex('post').where('_id', '=', 1);

      await request(app)
        .patch('/posts/1')
        .type('application/vnd.api+json')
        .send({ data: POSTS[0] })
        .expect(200);

      const [ postAfter ] = await knex('post').where('_id', '=', 1);

      expect(postAfter).to.exist;
      expect(postAfter.title).to.equal('New Title 1');
      expect(postAfter.date.valueOf()).to.equal(postBefore.date.valueOf());
      expect(postAfter.author).to.equal(null);
    });

    it('returns the resources', async function() {
      const res = await request(app)
        .patch('/posts/1')
        .type('application/vnd.api+json')
        .send({ data: POSTS[0] })
        .expect(200);

      expect(res.body.data.id).to.equal('1');
      expect(res.body.data.attributes.title).to.equal('New Title 1');
      expect(res.body.data.attributes.date).to.exist;
      expect(res.body.data.relationships).to.not.exist;
    });

    it('ignores surplus fields', async function() {
      const res = await request(app)
        .patch('/posts/1')
        .type('application/vnd.api+json')
        .send({ data: { ...POSTS[0], abc: 123 } })
        .expect(200);
    });
  });

  describe('collections', function() {
    it('inserts the resources', async function() {
      await request(app)
        .patch('/posts')
        .type('application/vnd.api+json')
        .send({ data: POSTS })
        .expect(200);

      const [ post1, post2 ] = await knex('post').whereIn('_id', [ 1, 2 ]).orderBy('_id');

      expect(post1).to.exist;
      expect(post1.title).to.equal('New Title 1');
      expect(post1.author).to.equal(null);

      expect(post2).to.exist;
      expect(post2.title).to.equal('New Title 2');
      expect(post2.author).to.equal(1);
    });

    it('returns the resources', async function() {
      const res = await request(app)
        .patch('/posts')
        .type('application/vnd.api+json')
        .send({ data: POSTS })
        .expect(200);

      expect(res.body.data[0].id).to.equal('1');
      expect(res.body.data[0].attributes.title).to.equal('New Title 1');
      expect(res.body.data[0].attributes.date).to.exist;
      expect(res.body.data[0].relationships).to.not.exist;

      expect(res.body.data[1].id).to.equal('2');
      expect(res.body.data[1].attributes.title).to.equal('New Title 2');
      expect(res.body.data[1].attributes.date).to.exist;
      expect(res.body.data[1].relationships.author).to.exist;
    });

    it('ignores surplus fields', async function() {
      await request(app)
        .patch('/posts')
        .type('application/vnd.api+json')
        .send({ data: POSTS.map(p => ({ ...p, abc: 123 })) })
        .expect(200);
    });

    it('is atomic', async function() {
      const pre = await app.connection('post');

      await request(app)
        .patch('/posts')
        .type('application/vnd.api+json')
        .send({ data: POSTS_WITH_BAD_AUTHOR })
        .expect(500);

      const post = await app.connection('post');

      expect(pre).deep.equals(post);
    });
  });
});
