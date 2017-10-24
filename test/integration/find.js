const getApp = require('../support/get-app-instance');
const dbHelpers = require('../support/database');
const request = require('supertest');
const { expect } = require('chai');

describe('integrated find', function() {
  let app, db;

  before(() => app = getApp());
  before(() => db = dbHelpers(app.connection));
  beforeEach(() => db.clear());
  beforeEach(() => db.load());
  after(() => db.close());

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

    describe('filters', function() {
      it('applies basic equality filters', async function() {
        const res = await request(app)
          .get('/posts')
          .query({ 'filter[simple][title]': 'Post 1' })
          .expect(200);

        expect(res.body.data).to.have.lengthOf(1);

        expect(res.body.data[0].attributes.title).to.equal('Post 1');
      });

      it('applies $in filters', async function() {
        const res = await request(app)
          .get('/posts')
          .query({ 'filter[simple][title][$in]': [ 'Post 1', 'Post 2' ] })
          .expect(200);

        expect(res.body.data).to.have.lengthOf(2);

        expect(res.body.data[0].attributes.title).to.equal('Post 1');
        expect(res.body.data[1].attributes.title).to.equal('Post 2');
      });

      it('applies $nin filters', async function() {
        const res = await request(app)
          .get('/posts')
          .query({ 'filter[simple][title][$nin]': [ 'Post 1', 'Post 2' ] })
          .expect(200);

        expect(res.body.data).to.have.lengthOf(2);

        expect(res.body.data[0].attributes.title).to.equal('Post 4');
        expect(res.body.data[1].attributes.title).to.equal('Post 3');
      });

      it('applies $lt filters', async function() {
        const res = await request(app)
          .get('/posts')
          .query({ 'filter[simple][title][$lt]': 'Post 2' })
          .expect(200);

        expect(res.body.data).to.have.lengthOf(1);

        expect(res.body.data[0].attributes.title).to.equal('Post 1');
      });

      it('applies $lte filters', async function() {
        const res = await request(app)
          .get('/posts')
          .query({ 'filter[simple][title][$lte]': 'Post 2' })
          .expect(200);

        expect(res.body.data).to.have.lengthOf(2);

        expect(res.body.data[0].attributes.title).to.equal('Post 1');
        expect(res.body.data[1].attributes.title).to.equal('Post 2');
      });

      it('applies $gt filters', async function() {
        const res = await request(app)
          .get('/posts')
          .query({ 'filter[simple][title][$gt]': 'Post 2' })
          .expect(200);

        expect(res.body.data).to.have.lengthOf(2);

        expect(res.body.data[0].attributes.title).to.equal('Post 4');
        expect(res.body.data[1].attributes.title).to.equal('Post 3');
      });

      it('applies $gte filters', async function() {
        const res = await request(app)
          .get('/posts')
          .query({ 'filter[simple][title][$gte]': 'Post 2' })
          .expect(200);

        expect(res.body.data).to.have.lengthOf(3);

        expect(res.body.data[0].attributes.title).to.equal('Post 2');
        expect(res.body.data[1].attributes.title).to.equal('Post 4');
        expect(res.body.data[2].attributes.title).to.equal('Post 3');
      });

      it('applies $eq filters', async function() {
        const res = await request(app)
          .get('/posts')
          .query({ 'filter[simple][title][$eq]': 'Post 2' })
          .expect(200);

        expect(res.body.data).to.have.lengthOf(1);

        expect(res.body.data[0].attributes.title).to.equal('Post 2');
      });

      it('applies $ne filters', async function() {
        const res = await request(app)
          .get('/posts')
          .query({ 'filter[simple][title][$ne]': 'Post 2' })
          .expect(200);

        expect(res.body.data).to.have.lengthOf(3);

        expect(res.body.data[0].attributes.title).to.equal('Post 1');
        expect(res.body.data[1].attributes.title).to.equal('Post 4');
        expect(res.body.data[2].attributes.title).to.equal('Post 3');
      });

      it('applies ordinal operators to dates', async function() {
        const res = await request(app)
          .get('/posts')
          .query({ 'filter[simple][date][$lt]': '2017-07-15T00:00:00.000Z' })
          .expect(200);

        expect(res.body.data).to.have.lengthOf(2);

        expect(res.body.data[0].attributes.title).to.equal('Post 1');
        expect(res.body.data[1].attributes.title).to.equal('Post 2');
      });

      // To match resapi-mongoose
      it(`doesn't care if $in value isn't an array`, async function() {
        const res = await request(app)
          .get('/posts')
          .query({ 'filter[simple][title][$in]': 'Post 1' })
          .expect(200);

        expect(res.body.data).to.have.lengthOf(1);

        expect(res.body.data[0].attributes.title).to.equal('Post 1');
      });

      it('catches filter errors', async function() {
        const res = await request(app)
          .get('/posts')
          .query({ 'filter[simple][$or][title]': 'Post 1' })
          .query({ 'filter[simple][$or][title]': 'Post 2' })
          .expect(400);

        expect(res.body.errors).to.have.lengthOf(1);
        expect(res.body.errors[0].title).to.equal('Bad filter');
      });
    });
  });

  describe('single resources', function() {
    it('uses types correctly', async function() {
      const res = await request(app)
        .get('/posts/1')
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data.id).to.equal('1');
      expect(res.body.data.type).to.equal('posts');
    });

    it('filters fields', async function() {
      const res = await request(app)
        .get('/posts/1')
        .query({ fields: { posts: 'title' } })
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data.id).to.equal('1');
      expect(res.body.data.attributes.title).to.exist;
      expect(res.body.data.attributes.date).to.not.exist;
    });

    it('ignores sorts', async function() {
      const res = await request(app)
        .get('/posts/1')
        .query({ sort: '-title,id' })
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data.id).to.equal('1');
    });

    it('ignores filters', async function() {
      const res = await request(app)
        .get('/posts/1')
        .query('filter[simple][title]', 'xyz')
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data.id).to.equal('1');
    });

    it('includes all attributes', async function() {
      const res = await request(app)
        .get('/posts/1')
        .accept('application/vnd.api+json')
        .expect(200);

      const { attributes } = res.body.data;

      expect(attributes.title).to.equal('Post 1');
      expect(attributes.date).to.equal('2017-05-31T12:00:00.000Z');
    });

    it('includes all local relationships', async function() {
      const res = await request(app)
        .get('/posts/1')
        .accept('application/vnd.api+json')
        .expect(200);

      const { data: author } = res.body.data.relationships.author;

      expect(author.id).to.equal('1');
    });

    it('includes all linked relationships', async function() {
      const res = await request(app)
        .get('/posts/1')
        .accept('application/vnd.api+json')
        .expect(200);

      const { data: tags } = res.body.data.relationships.tags;

      expect(tags[0].id).to.equal('1');
      expect(tags[1].id).to.equal('2');
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
});
