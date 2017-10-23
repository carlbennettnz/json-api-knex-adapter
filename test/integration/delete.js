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

describe('integrated delete', function() {
  let app, db;

  before(() => app = getApp());
  before(() => knex = app.connection);
  before(() => db = dbHelpers(knex));
  beforeEach(() => db.clear());
  beforeEach(() => db.load());
  after(() => db.close());

  describe('single resources', function() {
    it('deletes the resource and returns 204', async function() {
      await request(app)
        .delete('/posts/1')
        .expect(204);

      const [ { count } ] = await knex('post').count('*').where('_id', 1);

      expect(count).to.equal('0');
    });

    it('fails to delete missing resource', async function() {
      const res = await request(app)
        .delete('/posts/10')
        .expect(404);

      expect(res.body.errors[0].title).to.equal('No matching resource found');
    });
  });

  describe('collections', function() {
    it.skip('deletes the resources and return 204');
    it.skip(`doesn't care if the resources don't exist`);
  });
});
