import * as request from 'supertest'
import { expect } from 'chai'

import getApp from '../support/get-app-instance'
import dbHelpers from '../support/database'

/* eslint-disable max-nested-callbacks */

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

      expect(res.body.data[0].id).to.equal('000000000000000000000003');
      expect(res.body.data[1].id).to.equal('000000000000000000000004');
      expect(res.body.data[2].id).to.equal('000000000000000000000002');
      expect(res.body.data[3].id).to.equal('000000000000000000000001');
    });

    it.skip('populates relationships with include', async function() {
      const res = await request(app)
        .get('/posts')
        .query('include', 'author')
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data).to.have.lengthOf(4);
      expect(res.body.included).to.have.lengthOf(1);

      expect(res.body.included[0].attributes.id).to.equal('000000000000000000000001');
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

        expect(res.body.data.find(r => r.id === '000000000000000000000001').attributes.title).to.equal('Post 1');
        expect(res.body.data.find(r => r.id === '000000000000000000000002').attributes.title).to.equal('Post 2');
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

        expect(res.body.data.find(r => r.id === '000000000000000000000001').attributes.title).to.equal('Post 1');
        expect(res.body.data.find(r => r.id === '000000000000000000000002').attributes.title).to.equal('Post 2');
      });

      it('applies $gt filters', async function() {
        const res = await request(app)
          .get('/posts')
          .query({ 'filter[simple][title][$gt]': 'Post 2' })
          .expect(200);

        expect(res.body.data).to.have.lengthOf(2);

        expect(res.body.data.find(r => r.id === '000000000000000000000003').attributes.title).to.equal('Post 4');
        expect(res.body.data.find(r => r.id === '000000000000000000000004').attributes.title).to.equal('Post 3');
      });

      it('applies $gte filters', async function() {
        const res = await request(app)
          .get('/posts')
          .query({ 'filter[simple][title][$gte]': 'Post 2' })
          .expect(200);

        expect(res.body.data).to.have.lengthOf(3);

        expect(res.body.data.find(r => r.id === '000000000000000000000002').attributes.title).to.equal('Post 2');
        expect(res.body.data.find(r => r.id === '000000000000000000000003').attributes.title).to.equal('Post 4');
        expect(res.body.data.find(r => r.id === '000000000000000000000004').attributes.title).to.equal('Post 3');
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

        expect(res.body.data.find(r => r.id === '000000000000000000000001').attributes.title).to.equal('Post 1');
        expect(res.body.data.find(r => r.id === '000000000000000000000003').attributes.title).to.equal('Post 4');
        expect(res.body.data.find(r => r.id === '000000000000000000000004').attributes.title).to.equal('Post 3');
      });

      it('applies ordinal operators to dates', async function() {
        const res = await request(app)
          .get('/posts')
          .query({ 'filter[simple][date][$lt]': '2017-07-15T00:00:00.000Z' })
          .expect(200);

        expect(res.body.data).to.have.lengthOf(2);

        expect(res.body.data.find(r => r.id === '000000000000000000000001').attributes.title).to.equal('Post 1');
        expect(res.body.data.find(r => r.id === '000000000000000000000002').attributes.title).to.equal('Post 2');
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
        .get('/posts/000000000000000000000001')
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data.id).to.equal('000000000000000000000001');
      expect(res.body.data.type).to.equal('posts');
    });

    it('filters fields', async function() {
      const res = await request(app)
        .get('/posts/000000000000000000000001')
        .query({ fields: { posts: 'title' } })
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data.id).to.equal('000000000000000000000001');
      expect(res.body.data.attributes.title).to.exist;
      expect(res.body.data.attributes.date).to.not.exist;
    });

    it('ignores sorts', async function() {
      const res = await request(app)
        .get('/posts/000000000000000000000001')
        .query({ sort: '-title,id' })
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data.id).to.equal('000000000000000000000001');
    });

    it('ignores filters', async function() {
      const res = await request(app)
        .get('/posts/000000000000000000000001')
        .query('filter[simple][title]', 'xyz')
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data.id).to.equal('000000000000000000000001');
    });

    it('includes all attributes', async function() {
      const res = await request(app)
        .get('/posts/000000000000000000000001')
        .accept('application/vnd.api+json')
        .expect(200);

      const { attributes } = res.body.data;

      expect(attributes.title).to.equal('Post 1');
      expect(attributes.date).includes('2017-06-01');
    });

    it('includes all local relationships', async function() {
      const res = await request(app)
        .get('/posts/000000000000000000000001')
        .accept('application/vnd.api+json')
        .expect(200);

      const { data: author } = res.body.data.relationships.author;

      expect(author.id).to.equal('000000000000000000000001');
    });

    it('includes all linked relationships', async function() {
      const res = await request(app)
        .get('/awards/000000000000000000000001')
        .accept('application/vnd.api+json')
        .expect(200);

      const { data: winner } = res.body.data.relationships.winner;
      const { data: runnerUp } = res.body.data.relationships.runnerUp;
      const { data: winnerTags } = res.body.data.relationships.winnerTags;
      const { data: runnerUpTags } = res.body.data.relationships.runnerUpTags;

      const winnerTagIds = winnerTags.map(t => t.id);

      expect(winner.id).to.equal('000000000000000000000001');
      expect(runnerUp.id).to.equal('000000000000000000000002');
      expect(winnerTags).to.have.lengthOf(2);
      expect(runnerUpTags).to.have.lengthOf(1);
      expect(winnerTagIds).to.include('000000000000000000000001');
      expect(winnerTagIds).to.include('000000000000000000000002');
      expect(runnerUpTags[0].id).to.equal('000000000000000000000002');
    });

    it('includes linked one-to-many relationships', async function() {
      const res = await request(app)
        .get('/posts/000000000000000000000001')
        .accept('application/vnd.api+json')
        .expect(200);

      const { data: comments } = res.body.data.relationships.comments;

      expect(comments).to.have.lengthOf(3);
    });
  });

  describe('includes', function() {
    it('populates direct relationships', async function() {
      const res = await request(app)
        .get('/posts')
        .query({ include: 'author' })
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data).to.have.lengthOf(4);
      expect(res.body.included).to.have.lengthOf(1);

      expect(res.body.included[0].type).to.equal('authors');
      expect(res.body.included[0].id).to.equal('000000000000000000000001');
    });

    it('populates linked relationships', async function() {
      const res = await request(app)
        .get('/posts')
        .query({ include: 'tags' })
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data).to.have.lengthOf(4);
      expect(res.body.included).to.have.lengthOf(2);

      for (const inc of res.body.included) {
        expect(inc.type).to.equal('tags');
      }
    });

    it('populates direct and linked relationships together', async function() {
      const res = await request(app)
        .get('/posts')
        .query({ include: 'tags,author' })
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data).to.have.lengthOf(4);
      expect(res.body.included).to.have.lengthOf(3);

      for (const inc of res.body.included) {
        expect(['tags', 'authors'].includes(inc.type)).to.be.ok;
      }
    });

    it('populates multiple direct relationships of same type', async function() {
      const res = await request(app)
        .get('/awards')
        .query({ include: 'winner,runnerUp' })
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data).to.have.lengthOf(1);
      expect(res.body.included).to.have.lengthOf(2);
    });

    it('populates multiple linked relationships of same type', async function() {
      const res = await request(app)
        .get('/awards')
        .query({ include: 'winnerTags,runnerUpTags' })
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data).to.have.lengthOf(1);
      expect(res.body.included).to.have.lengthOf(2);
    });

    it('populates multiple direct and linked relationships together', async function() {
      const res = await request(app)
        .get('/awards')
        .query({ include: 'winner,runnerUp,winnerTags,runnerUpTags' })
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data).to.have.lengthOf(1);
      expect(res.body.included).to.have.lengthOf(4);
    });
  });
});
