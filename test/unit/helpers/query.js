const { expect } = require('chai');
const td = require('testdouble');
const where = td.function();
const query = { where };
const realKnex = require('knex')({ client: 'pg' });
const { applyFilters, joinLinkedRelationships } = require('../../../src/helpers/query');

describe('query helpers', function() {
  afterEach(td.reset);

  describe('apply filters', function() {
    it('applies filters without operators', function() {
      chainedQuery(3);

      const r = applyFilters(query, { a: 1, b: 'x', c: null });

      expect(r).to.exist;

      td.verify(query.where('a', '=', 1));
      td.verify(query.where('b', '=', 'x'));
      td.verify(query.where('c', '=', null));
    });

    it('applies $in filter', function() {
      chainedQuery(1);
      const r = applyFilters(query, { a: { $in: [ 1, 2 ] } });
      expect(r).to.exist;
      td.verify(query.where('a', 'in', [ 1, 2 ]));
    });

    it('applies $in filter', function() {
      chainedQuery(1);
      const r = applyFilters(query, { a: { $nin: [ 1, 2 ] } });
      expect(r).to.exist;
      td.verify(query.where('a', 'not in', [ 1, 2 ]));
    });

    it('applies $lt filter', function() {
      chainedQuery(1);
      const r = applyFilters(query, { a: { $lt: 1 } });
      expect(r).to.exist;
      td.verify(query.where('a', '<', 1));
    });

    it('applies $gt filter', function() {
      chainedQuery(1);
      const r = applyFilters(query, { a: { $gt: 1 } });
      expect(r).to.exist;
      td.verify(query.where('a', '>', 1));
    });

    it('applies $lte filter', function() {
      chainedQuery(1);
      const r = applyFilters(query, { a: { $lte: 1 } });
      expect(r).to.exist;
      td.verify(query.where('a', '<=', 1));
    });

    it('applies $gte filter', function() {
      chainedQuery(1);
      const r = applyFilters(query, { a: { $gte: 1 } });
      expect(r).to.exist;
      td.verify(query.where('a', '>=', 1));
    });

    it('applies $ne filter', function() {
      chainedQuery(1);
      const r = applyFilters(query, { a: { $ne: 1 } });
      expect(r).to.exist;
      td.verify(query.where('a', '!=', 1));
    });

    it('applies $ne filter', function() {
      chainedQuery(1);
      const r = applyFilters(query, { a: { $eq: 1 } });
      expect(r).to.exist;
      td.verify(query.where('a', '=', 1));
    });

    it('can combine operators', function() {
      chainedQuery(3);
      const r = applyFilters(query, { a: { $ne: 1, $lt: 7 }, b: { $gt: 5 } });
      expect(r).to.exist;
      td.verify(query.where('a', '!=', 1));
      td.verify(query.where('a', '<', 7));
      td.verify(query.where('b', '>', 5));
    });

    it('can combine operators and plain filters', function() {
      chainedQuery(2);
      const r = applyFilters(query, { a: 5, b: { $gt: 5 } });
      expect(r).to.exist;
      td.verify(query.where('a', '=', 5));
      td.verify(query.where('b', '>', 5));
    });

    it('deals with nulls', function() {
      chainedQuery(3);
      const r = applyFilters(query, { a: null, b: { $gt: null }, c: { $in: null } });
      expect(r).to.exist;
      td.verify(query.where('a', '=', null));
      td.verify(query.where('b', '>', null));
      td.verify(query.where('c', 'in', null));
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
      td.when(knex.raw('array_agg("f_table"."f_field") as "l_key"')).thenReturn(x);
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

function chainedQuery(times) {
  td.when(query.where(), { ignoreExtraArgs: true, times }).thenReturn(query);
}
