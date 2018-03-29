import * as request from 'supertest'
import { expect } from 'chai'

import getApp from '../support/get-app-instance'
import dbHelpers from '../support/database'

describe('integrated delete', function() {
  let app, knex, db;

  before(() => app = getApp());
  before(() => knex = app.connection);
  before(() => db = dbHelpers(knex));
  beforeEach(() => db.clear());
  beforeEach(() => db.load());
  after(() => db.close());

  describe('single resources', function() {
    it('deletes the resource and returns 204', async function() {
      const [ { count: precount } ] = await knex('post').count('*').where('_id', '000000000000000000000001');

      await request(app)
        .delete('/posts/000000000000000000000001')
        .expect(204);

      const [ { count: postcount } ] = await knex('post').count('*').where('_id', '000000000000000000000001');

      expect(precount).to.equal('1');
      expect(postcount).to.equal('0');
    });

    it('fails to delete missing resource', async function() {
      const res = await request(app)
        .delete('/posts/000000000000000000000999')
        .expect(404);

      expect(res.body.errors[0].title).to.equal('No matching resource found');
    });
  });

  describe('collections', function() {
    it.skip('deletes the resources and return 204');
    it.skip(`doesn't care if the resources don't exist`);
  });
});
