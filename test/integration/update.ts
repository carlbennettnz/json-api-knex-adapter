import getApp from '../support/get-app-instance'
import dbHelpers from '../support/database'
import * as request from 'supertest'
import { expect } from 'chai'

const POSTS = [{
  id: '000000000000000000000001',
  type: 'posts',
  attributes: { title: 'New Title 1' },
  relationships: { author: { data: null } }
}, {
  id: '000000000000000000000002',
  type: 'posts',
  attributes: { title: 'New Title 2', date: new Date('2017-10-15') }
}];
const POSTS_WITH_BAD_AUTHOR = [ ...POSTS, {
  id: '000000000000000000000003',
  type: 'posts',
  relationships: { author: { data: { id: '999', type: 'authors' } } }
} ];
const POSTS_WITH_REL_UPDATES = [{
  id: '000000000000000000000001',
  type: 'posts',
  attributes: {},
  relationships: { tags: { data: [] } }
}, {
  id: '000000000000000000000001',
  type: 'posts',
  attributes: {},
  relationships: { comments: { data: [] } }
}];

describe('integrated update', function() {
  let app, knex, db;

  before(() => { app = getApp() });
  before(() => { knex = app.connection });
  before(() => { db = dbHelpers(knex) });
  beforeEach(() => db.clear());
  beforeEach(() => db.load());
  after(() => db.close());

  describe('single resources', function() {
    it('updates the resource', async function() {
      const [ postBefore ] = await knex('post').where('_id', '=', '000000000000000000000001');

      await request(app)
        .patch('/posts/000000000000000000000001')
        .type('application/vnd.api+json')
        .send({ data: POSTS[0] })
        .expect(200);

      const [ postAfter ] = await knex('post').where('_id', '=', '000000000000000000000001');

      expect(postAfter).to.exist;
      expect(postAfter.title).to.equal('New Title 1');
      expect(postAfter.date.valueOf()).to.equal(postBefore.date.valueOf());
      expect(postAfter.author).to.equal(null);
    });

    it('returns the resources', async function() {
      const res = await request(app)
        .patch('/posts/000000000000000000000001')
        .type('application/vnd.api+json')
        .send({ data: POSTS[0] })
        .expect(200);

      expect(res.body.data.id).to.equal('000000000000000000000001');
      expect(res.body.data.attributes.title).to.equal('New Title 1');
      expect(res.body.data.attributes.date).to.exist;
      expect(res.body.data.relationships).to.exist;
      expect(res.body.data.relationships.tags.data).to.have.lengthOf(2);
    });

    it('ignores surplus fields', async function() {
      await request(app)
        .patch('/posts/000000000000000000000001')
        .type('application/vnd.api+json')
        .send({ data: { ...POSTS[0], abc: 123 } })
        .expect(200);
    });

    it('updates many-to-many relationships', async function() {
      const [ { count: preCount } ] = await knex('post_tag').where('post', '=', '000000000000000000000001').count();

      await request(app)
        .patch('/posts/000000000000000000000001')
        .type('application/vnd.api+json')
        .send({ data: POSTS_WITH_REL_UPDATES[0] })
        .expect(200);

      const [ { count: postCount } ] = await knex('post_tag').where('post', '=', '000000000000000000000001').count();

      expect(preCount).to.equal('2');
      expect(postCount).to.equal('0');
    });

    it('gives 403 forbidden when a user attempts to update one-to-many relationships', async function() {
      const [ { count: preCount } ] = await knex('comment').where('post', '=', '000000000000000000000001').count();

      try {
        await request(app)
          .patch('/posts/000000000000000000000001')
          .type('application/vnd.api+json')
          .send({ data: POSTS_WITH_REL_UPDATES[1] });
      } catch (err) {
        expect(err.response.status).to.equal(403);
        expect(err.response.body.errors).to.have.lengthOf(1);
        expect(err.response.body.errors[0].title).to.equal('Illegal update to one-to-many relationship');

        // https://github.com/ethanresnick/json-api/pull/139#issuecomment-377857355
        // expect(res.body.errors[0].paths.pointer).to.equal('/data/0/relationships/comments');

        const [{ count: postCount }] = await knex('comment').where('post', '=', '000000000000000000000001').count();

        expect(preCount).to.equal('3');
        expect(postCount).to.equal('3');

        return;
      }

      throw new Error('Expected request to fail');
    });
  });

  describe('collections', function() {
    it('inserts the resources', async function() {
      await request(app)
        .patch('/posts')
        .type('application/vnd.api+json')
        .send({ data: POSTS })
        .expect(200);

      const [ post1, post2 ] = await knex('post').whereIn('_id', [ '000000000000000000000001', '000000000000000000000002' ]).orderBy('_id');

      expect(post1).to.exist;
      expect(post1.title).to.equal('New Title 1');
      expect(post1.author).to.equal(null);

      expect(post2).to.exist;
      expect(post2.title).to.equal('New Title 2');
      expect(post2.author).to.equal('000000000000000000000001');
    });

    it('returns the resources', async function() {
      const res = await request(app)
        .patch('/posts')
        .type('application/vnd.api+json')
        .send({ data: POSTS })
        .expect(200);

      expect(res.body.data[0].id).to.equal('000000000000000000000001');
      expect(res.body.data[0].attributes.title).to.equal('New Title 1');
      expect(res.body.data[0].attributes.date).to.exist;
      expect(res.body.data[0].relationships).to.exist;
      expect(res.body.data[0].relationships.tags.data).to.have.lengthOf(2);

      expect(res.body.data[1].id).to.equal('000000000000000000000002');
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
      const pre = await knex('post');

      try {
        await request(app)
          .patch('/posts')
          .type('application/vnd.api+json')
          .send({ data: POSTS_WITH_BAD_AUTHOR });
      } catch (err) {
        expect(err.response.status).to.equal(500);

        const post = await knex('post');

        expect(pre).deep.equals(post);

        return;
      }

      throw new Error('Expected request to fail');
    });
  });
});
