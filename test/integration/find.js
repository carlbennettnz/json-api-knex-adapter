const app = require('../support/get-app-instance')();
const { clear, load, close } = require('../support/database')(app.connection);
const request = require('supertest');
const { expect } = require('chai');

describe('integrated find', function() {
  beforeEach(clear);
  beforeEach(load);
  after(close)

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
        .query({ sort: '-title,id'} )
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
});
