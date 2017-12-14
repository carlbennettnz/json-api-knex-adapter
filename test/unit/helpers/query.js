const { expect } = require('chai');
const td = require('testdouble');
const where = td.function();
const query = { where };
const realKnex = require('knex')({ client: 'pg' });
const { applyFilters, joinLinkedRelationships } = require('../../../src/helpers/query');

const model = {
  table: 'post',
  idKey: '_id',
  attrs: [
    { key: 'title' },
    { key: 'date' }
  ],
  relationships: [
    { type: 'authors', key: 'author' },
    { type: 'tags', key: 'tags', via: { table: 'post_tag', fk: 'post', pk: 'tag' } }
  ]
};

describe('query helpers', function() {
  afterEach(td.reset);

  describe('apply filters', function() {
    it('applies filters without operators', function() {
      const [ q1, q2 ] = chainedQuery([
        [ 'where', 'post.title',   '=', 1 ],
        [ 'where', 'post.author',  '=', 'x' ],
        [ 'where', 'post_tag.tag', '=', null ]
      ]);

      const r = applyFilters(q1, model, {
        title:  1,
        author: 'x',
        tags:   null
      });

      expect(r).to.equal(q2);
    });

    it('applies $in filter', function() {
      const [ q1, q2 ] = chainedQuery([
        [ 'where', 'post.title',   'in', [ 1, 2 ] ],
        [ 'where', 'post.author',  'in', [ 'x', 'y' ] ],
        [ 'where', 'post_tag.tag', 'in', [] ]
      ]);

      const r = applyFilters(q1, model, {
        title:  { $in: [ 1, 2 ] },
        author: { $in: [ 'x', 'y' ] },
        tags:   { $in: [] }
      });

      expect(r).to.equal(q2);
    });

    it('applies $in filter', function() {
      const [ q1, q2 ] = chainedQuery([
        [ 'where', 'post.title',   'not in', [ 1, 2 ] ],
        [ 'where', 'post.author',  'not in', [ 'x', 'y' ] ],
        [ 'where', 'post_tag.tag', 'not in', [] ]
      ]);

      const r = applyFilters(q1, model, {
        title:  { $nin: [ 1, 2 ] },
        author: { $nin: [ 'x', 'y' ] },
        tags:   { $nin: [] }
      });

      expect(r).to.equal(q2);
    });

    it('applies $lt filter', function() {
      const [ q1, q2 ] = chainedQuery([
        [ 'where', 'post.title',   '<', 1 ],
        [ 'where', 'post.author',  '<', 'x' ],
        [ 'where', 'post_tag.tag', '<', null ]
      ]);

      const r = applyFilters(q1, model, {
        title:  { $lt: 1 },
        author: { $lt: 'x' },
        tags:   { $lt: null }
      });

      expect(r).to.equal(q2);
    });

    it('applies $gt filter', function() {
      const [ q1, q2 ] = chainedQuery([
        [ 'where', 'post.title',   '>', 1 ],
        [ 'where', 'post.author',  '>', 'x' ],
        [ 'where', 'post_tag.tag', '>', null ]
      ]);

      const r = applyFilters(q1, model, {
        title:  { $gt: 1 },
        author: { $gt: 'x' },
        tags:   { $gt: null }
      });

      expect(r).to.equal(q2);
    });

    it('applies $lte filter', function() {
      const [ q1, q2 ] = chainedQuery([
        [ 'where', 'post.title',   '<=', 1 ],
        [ 'where', 'post.author',  '<=', 'x' ],
        [ 'where', 'post_tag.tag', '<=', null ]
      ]);

      const r = applyFilters(q1, model, {
        title:  { $lte: 1 },
        author: { $lte: 'x' },
        tags:   { $lte: null }
      });

      expect(r).to.equal(q2);
    });

    it('applies $gte filter', function() {
      const [ q1, q2 ] = chainedQuery([
        [ 'where', 'post.title',   '>=', 1 ],
        [ 'where', 'post.author',  '>=', 'x' ],
        [ 'where', 'post_tag.tag', '>=', null ]
      ]);

      const r = applyFilters(q1, model, {
        title:  { $gte: 1 },
        author: { $gte: 'x' },
        tags:   { $gte: null }
      });

      expect(r).to.equal(q2);
    });

    it('applies $ne filter', function() {
      const [ q1, q2 ] = chainedQuery([
        [ 'where', 'post.title',   '!=', 1 ],
        [ 'where', 'post.author',  '!=', 'x' ],
        [ 'where', 'post_tag.tag', '!=', null ]
      ]);

      const r = applyFilters(q1, model, {
        title:  { $ne: 1 },
        author: { $ne: 'x' },
        tags:   { $ne: null }
      });

      expect(r).to.equal(q2);
    });

    it('applies $eq filter', function() {
      const [ q1, q2 ] = chainedQuery([
        [ 'where', 'post.title',   '=', 1 ],
        [ 'where', 'post.author',  '=', 'x' ],
        [ 'where', 'post_tag.tag', '=', null ]
      ]);

      const r = applyFilters(q1, model, {
        title:  { $eq: 1 },
        author: { $eq: 'x' },
        tags:   { $eq: null }
      });

      expect(r).to.equal(q2);
    });

    it('can combine operators', function() {
      const [ q1, q2 ] = chainedQuery([
        [ 'where', 'post.title',   '!=', 'x' ],
        [ 'where', 'post.title',   '<',  'y' ],
        [ 'where', 'post_tag.tag', '>',  5 ]
      ]);

      const r = applyFilters(q1, model, {
        title: { $ne: 'x', $lt: 'y' },
        tags: { $gt: 5 }
      });

      expect(r).to.equal(q2);
    });

    it('can combine operators and plain filters', function() {
      const [ q1, q2 ] = chainedQuery([
        [ 'where', 'post.title',   '=', 'x' ],
        [ 'where', 'post_tag.tag', '>',  5 ]
      ]);

      const r = applyFilters(q1, model, {
        title: 'x',
        tags: { $gt: 5 }
      });

      expect(r).to.equal(q2);
    });

    it('throws if given an invalid filter', function() {
      try {
        applyFilters(null, { attrs: [], relationships: [] }, []);
      } catch (err) {
        expect(err.status).to.equal('400');
        expect(err.title).to.equal('Bad filter');
        expect(err.detail).to.equal('Filters must be an object.');
        return;
      }

      throw new Error('Expected bad key to cause exception to be thrown');
    });

    it('throws if asked to filter by a non-existent key', function() {
      try {
        applyFilters(null, { attrs: [], relationships: [] }, { a: 1 });
      } catch (err) {
        expect(err.status).to.equal('400');
        expect(err.title).to.equal('Bad filter');
        expect(err.detail).to.equal('Path a does not exist.');
        return;
      }

      throw new Error('Expected bad key to cause exception to be thrown');
    });

    it('throws if given a top-level operator', function() {
      try {
        applyFilters(null, { attrs: [], relationships: [] }, { $and: [ { x: 1 } ] });
      } catch (err) {
        expect(err.status).to.equal('400');
        expect(err.title).to.equal('Bad filter');
        expect(err.detail).to.equal('Expected to find an attribute name, got $and. Logical operators are not supported.');
        return;
      }

      throw new Error('Expected bad key to cause exception to be thrown');
    });
  });

  describe('join linked relationships', function() {
    const knex = { raw: td.function() };
    const query = td.object(realKnex('post'));

    it('joins to-many relationships', function() {
      const model = {
        table: 'l_table',
        idKey: 'l_id',
        relationships: [{
          type: 'f',
          key: 'l_key',
          via: { table: 'f_table', fk: 'f_key', pk: 'f_field' }
        }]
      };

      const x = Symbol('x');
      const y = Symbol('y');
      td.when(knex.raw('array_agg("f_table"."f_field"::text) as "l_key"')).thenReturn(x);
      td.when(query.select(x)).thenReturn(query);
      td.when(query.leftJoin('f_table', 'l_table.l_id', 'f_table.f_key')).thenReturn(query);
      td.when(query.groupBy('l_table.l_id')).thenReturn(y);

      const q = joinLinkedRelationships(knex, query, model, []);

      expect(q).to.equal(y);
    });

    it('ignores relationships without a `via` attribute', function() {
      const model = {
        table: 'l_table',
        idKey: 'l_id',
        relationships: [{
          type: 'f',
          key: 'l_key'
        }]
      };

      const x = Symbol('x');
      const q = joinLinkedRelationships(null, x, model, []);

      expect(q).to.equal(x);
    });

    it('ignores filtered fields', function() {
      const model = {
        table: 'l_table',
        idKey: 'l_id',
        relationships: [{
          type: 'f',
          key: 'l_key',
          via: { table: 'f_table', fk: 'f_key', pk: 'f_field' }
        }]
      };

      const x = Symbol('x');
      const q = joinLinkedRelationships(null, x, model, ['not_l_key']);

      expect(q).to.equal(x);
    });
  });
});

function chainedQuery(argSets) {
  const q1 = td.object(query);
  let q2 = q1;

  for (const [ fn, ...args ] of argSets) {
    const q = q2;
    q2 = td.object(query);
    td.when(q[fn](...args)).thenReturn(q2);
  }

  return [ q1, q2 ];
}
