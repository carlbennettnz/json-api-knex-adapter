import * as request from 'supertest'
import { expect } from 'chai'

import getApp from '../support/get-app-instance'
import dbHelpers from '../support/database'

/* eslint-disable max-nested-callbacks */

describe('integrated find', function() {
  let app, db;

  before(() => { app = getApp() });
  before(() => { db = dbHelpers(app.connection) });
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
        .get('/posts?sort=-title,id')
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data).to.have.lengthOf(4);

      expect(res.body.data[0].id).to.equal('000000000000000000000003');
      expect(res.body.data[1].id).to.equal('000000000000000000000004');
      expect(res.body.data[2].id).to.equal('000000000000000000000002');
      expect(res.body.data[3].id).to.equal('000000000000000000000001');
    });

    it('applies sort based on relationship attribute', async function () {
      const res = await request(app)
        .get('/posts?sort=author.name,id')
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data[0].id).to.equal('000000000000000000000004');
      expect(res.body.data[1].id).to.equal('000000000000000000000001');
      expect(res.body.data[2].id).to.equal('000000000000000000000002');
      expect(res.body.data[3].id).to.equal('000000000000000000000003');

    });

    it('populates relationships with include', async function() {
      const res = await request(app)
        .get('/posts')
        .query({ include: 'author' })
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data).to.have.lengthOf(4);
      expect(res.body.included).to.have.lengthOf(2);

      expect(res.body.included[0].id).to.equal('000000000000000000000001');
    });

    describe('filters', function() {
      it('applies basic equality filters', async function() {
        const res = await request(app)
          .get('/posts')
          .query('filter=(title,`Post 1`)')
          .expect(200);

        expect(res.body.data).to.have.lengthOf(1);

        expect(res.body.data[0].attributes.title).to.equal('Post 1');
      });

      it('applies in filters', async function() {
        const res = await request(app)
          .get('/posts')
          .query('filter=(title,in,[`Post 1`,`Post 2`])')
          .expect(200);

        expect(res.body.data).to.have.lengthOf(2);

        expect(res.body.data.find(r => r.id === '000000000000000000000001').attributes.title).to.equal('Post 1');
        expect(res.body.data.find(r => r.id === '000000000000000000000002').attributes.title).to.equal('Post 2');
      });

      it('applies nin filters', async function() {
        const res = await request(app)
          .get('/posts')
          .query('filter=(title,nin,[`Post 1`,`Post 2`])')
          .expect(200);

        expect(res.body.data).to.have.lengthOf(2);

        expect(res.body.data[0].attributes.title).to.equal('Post 4');
        expect(res.body.data[1].attributes.title).to.equal('Post 3');
      });

      it('applies lt filters', async function() {
        const res = await request(app)
          .get('/posts')
          .query('filter=(title,lt,`Post 2`)')
          .expect(200);

        expect(res.body.data).to.have.lengthOf(1);

        expect(res.body.data[0].attributes.title).to.equal('Post 1');
      });

      it('applies lte filters', async function() {
        const res = await request(app)
          .get('/posts')
          .query('filter=(title,lte,`Post 2`)')
          .expect(200);

        expect(res.body.data).to.have.lengthOf(2);

        expect(res.body.data.find(r => r.id === '000000000000000000000001').attributes.title).to.equal('Post 1');
        expect(res.body.data.find(r => r.id === '000000000000000000000002').attributes.title).to.equal('Post 2');
      });

      it('applies gt filters', async function() {
        const res = await request(app)
          .get('/posts')
          .query('filter=(title,gt,`Post 2`)')
          .expect(200);

        expect(res.body.data).to.have.lengthOf(2);

        expect(res.body.data.find(r => r.id === '000000000000000000000003').attributes.title).to.equal('Post 4');
        expect(res.body.data.find(r => r.id === '000000000000000000000004').attributes.title).to.equal('Post 3');
      });

      it('applies gte filters', async function() {
        const res = await request(app)
          .get('/posts')
          .query('filter=(title,gte,`Post 2`)')
          .expect(200);

        expect(res.body.data).to.have.lengthOf(3);

        expect(res.body.data.find(r => r.id === '000000000000000000000002').attributes.title).to.equal('Post 2');
        expect(res.body.data.find(r => r.id === '000000000000000000000003').attributes.title).to.equal('Post 4');
        expect(res.body.data.find(r => r.id === '000000000000000000000004').attributes.title).to.equal('Post 3');
      });

      it('applies eq filters', async function() {
        const res = await request(app)
          .get('/posts')
          .query('filter=(title,eq,`Post 2`)')
          .expect(200);

        expect(res.body.data).to.have.lengthOf(1);

        expect(res.body.data[0].attributes.title).to.equal('Post 2');
      });

      it('applies ne filters', async function() {
        const res = await request(app)
          .get('/posts')
          .query('filter=(title,ne,`Post 2`)')
          .expect(200);

        expect(res.body.data).to.have.lengthOf(3);

        expect(res.body.data.find(r => r.id === '000000000000000000000001').attributes.title).to.equal('Post 1');
        expect(res.body.data.find(r => r.id === '000000000000000000000003').attributes.title).to.equal('Post 4');
        expect(res.body.data.find(r => r.id === '000000000000000000000004').attributes.title).to.equal('Post 3');
      });

      it('applies multiple filters using or', async function() {
        const res = await request(app)
          .get('/posts')
          .query('filter=(or,(title,eq,`Post 2`),(title,eq,`Post 3`))')
          .expect(200);

        expect(res.body.data).to.have.lengthOf(2);

        expect(res.body.data.find(r => r.id === '000000000000000000000002').attributes.title).to.equal('Post 2');
        expect(res.body.data.find(r => r.id === '000000000000000000000004').attributes.title).to.equal('Post 3');
      });

      it('applies multiple filters using and', async function() {
        const res = await request(app)
          .get('/posts')
          .query('filter=(and,(author,eq,`000000000000000000000001`),(title,gte,`Post 2`))')
          .expect(200);

        expect(res.body.data).to.have.lengthOf(2);

        expect(res.body.data.find(r => r.id === '000000000000000000000002').attributes.title).to.equal('Post 2');
        expect(res.body.data.find(r => r.id === '000000000000000000000003').attributes.title).to.equal('Post 4');
      });

      it('applies ordinal operators to dates', async function() {
        const res = await request(app)
          .get('/posts')
          .query('filter=(date,lt,`2017-07-15T00:00:00.000Z`)')
          .expect(200);

        expect(res.body.data).to.have.lengthOf(2);

        expect(res.body.data.find(r => r.id === '000000000000000000000001').attributes.title).to.equal('Post 1');
        expect(res.body.data.find(r => r.id === '000000000000000000000002').attributes.title).to.equal('Post 2');
      });

      // To match resapi-mongoose
      it(`doesn't care if in value isn't an array`, async function() {
        const res = await request(app)
          .get('/posts')
          .query('filter=(title,in,`Post 1`)')
          .expect(200);

        expect(res.body.data).to.have.lengthOf(1);

        expect(res.body.data[0].attributes.title).to.equal('Post 1');
      });
    });

    describe('pagination', function() {
      it('respects limits', async function() {
        const res = await request(app)
          .get('/posts?page[limit]=2&sort=id')
          .accept('application/vnd.api+json')
          .expect(200);

        expect(res.body.data).to.have.lengthOf(2);
        expect(res.body.data[0].id).to.equal('000000000000000000000001');
        expect(res.body.data[1].id).to.equal('000000000000000000000002');
      });

      it('respects offsets', async function () {
        const res = await request(app)
          .get('/posts?page[limit]=2&page[offset]=2&sort=id')
          .accept('application/vnd.api+json')
          .expect(200);

        expect(res.body.data).to.have.lengthOf(2);
        expect(res.body.data[0].id).to.equal('000000000000000000000003');
        expect(res.body.data[1].id).to.equal('000000000000000000000004');
      });

      it('does not include related resources to those excluded by a page limit', async function () {
        const res = await request(app)
          .get('/posts?page[limit]=1&sort=id&include=author')
          .accept('application/vnd.api+json')
          .expect(200);

        expect(res.body.included).to.have.lengthOf(1);
        expect(res.body.included[0].id).to.equal('000000000000000000000001');
        expect(res.body.included[0].type).to.equal('authors');
      });

      it('returns the collection size when a limit is applied', async function() {
        const res = await request(app)
          .get('/posts')
          .query('page[limit]=1')
          .accept('application/vnd.api+json')
          .expect(200);

        expect(res.body.meta.total).to.equal(4)
      });

      it('does not return the collection size when a limit is not applied', async function() {
        const res = await request(app)
          .get('/posts')
          .accept('application/vnd.api+json')
          .expect(200);

        expect(res.body.meta && res.body.meta.total).to.not.exist
      });

      it('adjusts the collection size if a filter is applied', async function() {
        const res = await request(app)
          .get('/posts')
          .query('page[limit]=1')
          .query('filter=(title,`Post 1`)')
          .accept('application/vnd.api+json')
          .expect(200);

        expect(res.body.meta.total).to.equal(1)
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
        .get('/posts/000000000000000000000001?sort=-title,id')
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data.id).to.equal('000000000000000000000001');
    });

    it('ignores filters', async function() {
      const res = await request(app)
        .get('/posts/000000000000000000000001')
        .query({ 'filter[simple][title]': 'xyz' })
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data.id).to.equal('000000000000000000000001');
    });

    it('rejects pagination', async function() {
      try {
        await request(app)
          .get('/posts/000000000000000000000001')
          .query('page[limit]=1')
          .accept('application/vnd.api+json');
      } catch (err) {
        expect(err.status).to.equal(400);
        return;
      }

      throw new Error('Expected request to fail');
    })

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

    it('includes correct type for all local relationships', async function() {
      const res = await request(app)
        .get('/posts/000000000000000000000001')
        .accept('application/vnd.api+json')
        .expect(200);

      const { data: author } = res.body.data.relationships.author;

      expect(author.type).to.equal('authors');
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

    it('includes correct type for all linked relationships', async function () {
      const res = await request(app)
        .get('/awards/000000000000000000000001')
        .accept('application/vnd.api+json')
        .expect(200);

      const { data: winner } = res.body.data.relationships.winner;

      expect(winner.type).to.equal('authors');
    });

    it('includes linked one-to-many relationships', async function() {
      const res = await request(app)
        .get('/posts/000000000000000000000001')
        .accept('application/vnd.api+json')
        .expect(200);

      const { data: comments } = res.body.data.relationships.comments;

      expect(comments).to.have.lengthOf(3);
    });

    it('includes correct type for all linked one-to-many relationships', async function () {
      const res = await request(app)
        .get('/posts/000000000000000000000001')
        .accept('application/vnd.api+json')
        .expect(200);

      const { data: comments } = res.body.data.relationships.comments;

      expect(comments[0].type).to.equal('comments');
    });

    it('gives 404 if the resource is missing', async function() {
      try {
        const res = await request(app)
          .get('/posts/not-found')
          .accept('application/vnd.api+json');
      } catch (err) {
        expect(err.response.status).to.equal(404);
        expect(err.response.body.errors[0].title).to.equal('One or more of the targeted resources could not be found.');
        return;
      }

      throw new Error('Expected request to fail');
    })
  });

  describe('includes', function() {
    it('populates direct relationships', async function() {
      const res = await request(app)
        .get('/posts')
        .query({ include: 'author' })
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data).to.have.lengthOf(4);
      expect(res.body.included).to.have.lengthOf(2);

      expect(res.body.included[0].type).to.equal('authors');
      expect(res.body.included[0].id).to.equal('000000000000000000000001');
      expect(res.body.included[1].type).to.equal('authors');
      expect(res.body.included[1].id).to.equal('000000000000000000000002');
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
      expect(res.body.included).to.have.lengthOf(4);

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

    it('populates direct relationships on an included resource', async function() {
      const res = await request(app)
        .get('/posts')
        .query({ include: 'comments' })
        .accept('application/vnd.api+json')
        .expect(200);

      res.body.included.forEach(includedResource => {
        expect(includedResource.type).to.equal('comments')
        expect(includedResource.relationships.post.data.type).to.equal('posts')
      })
    })

    it('populates linked relationships on an included resource', async function() {
      const res = await request(app)
        .get('/awards')
        .query({ include: 'winner' })
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.included).to.have.lengthOf(1)
      expect(res.body.included[0].relationships.posts.data).to.have.lengthOf(3)
    })

    it('works with filters on attributes', async () => {
      const res = await request(app)
        .get('/posts')
        .query('include=author&filter=(title,`Post 1`)')
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data).to.have.lengthOf(1);
      expect(res.body.included).to.have.lengthOf(1);

      expect(res.body.included[0].type).to.equal('authors');
      expect(res.body.included[0].id).to.equal('000000000000000000000001');
    });

    it('works with filters on direct relationships', async () => {
      const res = await request(app)
        .get('/posts')
        .query('include=author&filter=(tags,`000000000000000000000001`)')
        .accept('application/vnd.api+json')
        .expect(200);

      expect(res.body.data).to.have.lengthOf(1);
      expect(res.body.included).to.have.lengthOf(1);

      expect(res.body.included[0].type).to.equal('authors');
      expect(res.body.included[0].id).to.equal('000000000000000000000001');
    });
  });
});
