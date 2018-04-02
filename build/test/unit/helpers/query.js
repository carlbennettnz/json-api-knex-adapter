"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const td = require("testdouble");
const RealKnex = require("knex");
const query_1 = require("../../../src/helpers/query");
const realKnex = RealKnex({ client: 'pg' });
const where = td.function();
const query = { where };
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
describe('query helpers', function () {
    afterEach(td.reset);
    describe('apply filters', function () {
        it('applies filters without operators', function () {
            const [q1, q2] = chainedQuery([
                ['where', 'post.title', '=', 1],
                ['where', 'post.author', '=', 'x'],
                ['where', 'post_tag.tag', '=', null]
            ]);
            const r = query_1.applyFilters(q1, model, {
                title: 1,
                author: 'x',
                tags: null
            });
            chai_1.expect(r).to.equal(q2);
        });
        it('applies $in filter', function () {
            const [q1, q2] = chainedQuery([
                ['where', 'post.title', 'in', [1, 2]],
                ['where', 'post.author', 'in', ['x', 'y']],
                ['where', 'post_tag.tag', 'in', []]
            ]);
            const r = query_1.applyFilters(q1, model, {
                title: { $in: [1, 2] },
                author: { $in: ['x', 'y'] },
                tags: { $in: [] }
            });
            chai_1.expect(r).to.equal(q2);
        });
        it('applies $in filter', function () {
            const [q1, q2] = chainedQuery([
                ['where', 'post.title', 'not in', [1, 2]],
                ['where', 'post.author', 'not in', ['x', 'y']],
                ['where', 'post_tag.tag', 'not in', []]
            ]);
            const r = query_1.applyFilters(q1, model, {
                title: { $nin: [1, 2] },
                author: { $nin: ['x', 'y'] },
                tags: { $nin: [] }
            });
            chai_1.expect(r).to.equal(q2);
        });
        it('applies $lt filter', function () {
            const [q1, q2] = chainedQuery([
                ['where', 'post.title', '<', 1],
                ['where', 'post.author', '<', 'x'],
                ['where', 'post_tag.tag', '<', null]
            ]);
            const r = query_1.applyFilters(q1, model, {
                title: { $lt: 1 },
                author: { $lt: 'x' },
                tags: { $lt: null }
            });
            chai_1.expect(r).to.equal(q2);
        });
        it('applies $gt filter', function () {
            const [q1, q2] = chainedQuery([
                ['where', 'post.title', '>', 1],
                ['where', 'post.author', '>', 'x'],
                ['where', 'post_tag.tag', '>', null]
            ]);
            const r = query_1.applyFilters(q1, model, {
                title: { $gt: 1 },
                author: { $gt: 'x' },
                tags: { $gt: null }
            });
            chai_1.expect(r).to.equal(q2);
        });
        it('applies $lte filter', function () {
            const [q1, q2] = chainedQuery([
                ['where', 'post.title', '<=', 1],
                ['where', 'post.author', '<=', 'x'],
                ['where', 'post_tag.tag', '<=', null]
            ]);
            const r = query_1.applyFilters(q1, model, {
                title: { $lte: 1 },
                author: { $lte: 'x' },
                tags: { $lte: null }
            });
            chai_1.expect(r).to.equal(q2);
        });
        it('applies $gte filter', function () {
            const [q1, q2] = chainedQuery([
                ['where', 'post.title', '>=', 1],
                ['where', 'post.author', '>=', 'x'],
                ['where', 'post_tag.tag', '>=', null]
            ]);
            const r = query_1.applyFilters(q1, model, {
                title: { $gte: 1 },
                author: { $gte: 'x' },
                tags: { $gte: null }
            });
            chai_1.expect(r).to.equal(q2);
        });
        it('applies $ne filter', function () {
            const [q1, q2] = chainedQuery([
                ['where', 'post.title', '!=', 1],
                ['where', 'post.author', '!=', 'x'],
                ['where', 'post_tag.tag', '!=', null]
            ]);
            const r = query_1.applyFilters(q1, model, {
                title: { $ne: 1 },
                author: { $ne: 'x' },
                tags: { $ne: null }
            });
            chai_1.expect(r).to.equal(q2);
        });
        it('applies $eq filter', function () {
            const [q1, q2] = chainedQuery([
                ['where', 'post.title', '=', 1],
                ['where', 'post.author', '=', 'x'],
                ['where', 'post_tag.tag', '=', null]
            ]);
            const r = query_1.applyFilters(q1, model, {
                title: { $eq: 1 },
                author: { $eq: 'x' },
                tags: { $eq: null }
            });
            chai_1.expect(r).to.equal(q2);
        });
        it('can combine operators', function () {
            const [q1, q2] = chainedQuery([
                ['where', 'post.title', '!=', 'x'],
                ['where', 'post.title', '<', 'y'],
                ['where', 'post_tag.tag', '>', 5]
            ]);
            const r = query_1.applyFilters(q1, model, {
                title: { $ne: 'x', $lt: 'y' },
                tags: { $gt: 5 }
            });
            chai_1.expect(r).to.equal(q2);
        });
        it('can combine operators and plain filters', function () {
            const [q1, q2] = chainedQuery([
                ['where', 'post.title', '=', 'x'],
                ['where', 'post_tag.tag', '>', 5]
            ]);
            const r = query_1.applyFilters(q1, model, {
                title: 'x',
                tags: { $gt: 5 }
            });
            chai_1.expect(r).to.equal(q2);
        });
        it('throws if given an invalid filter', function () {
            try {
                query_1.applyFilters(null, { attrs: [], relationships: [] }, []);
            }
            catch (err) {
                chai_1.expect(err.status).to.equal('400');
                chai_1.expect(err.title).to.equal('Bad filter');
                chai_1.expect(err.detail).to.equal('Filters must be an object.');
                return;
            }
            throw new Error('Expected bad key to cause exception to be thrown');
        });
        it('throws if asked to filter by a non-existent key', function () {
            try {
                query_1.applyFilters(null, { attrs: [], relationships: [] }, { a: 1 });
            }
            catch (err) {
                chai_1.expect(err.status).to.equal('400');
                chai_1.expect(err.title).to.equal('Bad filter');
                chai_1.expect(err.detail).to.equal('Path a does not exist.');
                return;
            }
            throw new Error('Expected bad key to cause exception to be thrown');
        });
        it('throws if given a top-level operator', function () {
            try {
                query_1.applyFilters(null, { attrs: [], relationships: [] }, { $and: [{ x: 1 }] });
            }
            catch (err) {
                chai_1.expect(err.status).to.equal('400');
                chai_1.expect(err.title).to.equal('Bad filter');
                chai_1.expect(err.detail).to.equal('Expected to find an attribute name, got $and. Logical operators are not supported.');
                return;
            }
            throw new Error('Expected bad key to cause exception to be thrown');
        });
    });
    describe('join linked relationships', function () {
        const knex = { raw: td.function() };
        const query = td.object(realKnex('post'));
        it('joins to-many relationships', function () {
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
            td.when(knex.raw('array_agg(distinct "f_table"."f_field"::text) as "l_key"')).thenReturn(x);
            td.when(query.select(x)).thenReturn(query);
            td.when(query.leftJoin('f_table', 'l_table.l_id', 'f_table.f_key')).thenReturn(query);
            td.when(query.groupBy('l_table.l_id')).thenReturn(y);
            const q = query_1.joinLinkedRelationships(knex, query, model, []);
            chai_1.expect(q).to.equal(y);
        });
        it('ignores relationships without a `via` attribute', function () {
            const model = {
                table: 'l_table',
                idKey: 'l_id',
                relationships: [{
                        type: 'f',
                        key: 'l_key'
                    }]
            };
            const x = Symbol('x');
            const q = query_1.joinLinkedRelationships(null, x, model, []);
            chai_1.expect(q).to.equal(x);
        });
        it('ignores filtered fields', function () {
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
            const q = query_1.joinLinkedRelationships(null, x, model, ['not_l_key']);
            chai_1.expect(q).to.equal(x);
        });
    });
});
function chainedQuery(argSets) {
    const q1 = td.object(query);
    let q2 = q1;
    for (const [fn, ...args] of argSets) {
        const q = q2;
        q2 = td.object(query);
        td.when(q[fn](...args)).thenReturn(q2);
    }
    return [q1, q2];
}
