"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const knex_adapter_1 = require("../../src/knex-adapter");
const testdouble_1 = require("testdouble");
const normalize_models_1 = require("../../src/helpers/normalize-models");
const RealKnex = require("knex");
const json_api_1 = require("json-api");
const realKnex = RealKnex({ client: 'pg' });
const models = normalize_models_1.default({
    posts: {
        table: 'post',
        idKey: '_id',
        attrs: ['title', 'date'],
        relationships: [{ type: 'authors', key: 'author' }]
    }
});
const knex = testdouble_1.default.object(realKnex('post'));
const POSTS = [
    { _id: 1, title: 'Post 1', author: 1 },
    { _id: 2, title: 'Post 2', author: 1 }
];
const adapter = new knex_adapter_1.default(models, knex);
describe('find', function () {
    afterEach(testdouble_1.default.reset);
    it('uses the correct basic structure', function () {
        return __awaiter(this, void 0, void 0, function* () {
            testdouble_1.default.when(knex.from('post')).thenReturn(knex);
            testdouble_1.default.when(knex.select('post.*')).thenResolve(POSTS);
            const [primary, included] = yield adapter.find('posts', null, null, null, null, null);
            chai_1.expect(primary).to.be.instanceOf(json_api_1.Collection);
            chai_1.expect(primary.resources).to.have.lengthOf(2);
            primary.resources.forEach(r => {
                chai_1.expect(r).to.be.an.instanceOf(json_api_1.Resource);
                chai_1.expect(r.id).to.a('string');
                chai_1.expect(Object.keys(r.attrs)).to.have.lengthOf(1);
                chai_1.expect(r.attrs.title).to.be.a('string');
                chai_1.expect(Object.keys(r.relationships)).to.have.lengthOf(1);
                const rel = r.relationships.author;
                chai_1.expect(rel).to.be.instanceOf(json_api_1.Relationship);
                chai_1.expect(rel.linkage).to.be.instanceOf(json_api_1.Linkage);
                chai_1.expect(rel.linkage.value.type).to.equal('authors');
                chai_1.expect(rel.linkage.value.id).to.be.a('string');
            });
            chai_1.expect(included).to.be.instanceOf(json_api_1.Collection);
            chai_1.expect(included.resources).to.have.lengthOf(0);
        });
    });
    it('finds all resources of type', function () {
        return __awaiter(this, void 0, void 0, function* () {
            testdouble_1.default.when(knex.from('post')).thenReturn(knex);
            testdouble_1.default.when(knex.select('post.*')).thenResolve(POSTS);
            const [primary, included] = yield adapter.find('posts', null, null, null, null, null);
            chai_1.expect(primary.resources).to.have.lengthOf(2);
            primary.resources.forEach((r, i) => {
                chai_1.expect(r.id).to.equal((i + 1).toString());
                chai_1.expect(r.attrs.title).to.equal(`Post ${i + 1}`);
                chai_1.expect(r.relationships.author.linkage.value.id).to.equal('1');
            });
            chai_1.expect(included.resources).to.have.lengthOf(0);
        });
    });
    it('filters by id array', function () {
        return __awaiter(this, void 0, void 0, function* () {
            testdouble_1.default.when(knex.from('post')).thenReturn(knex);
            testdouble_1.default.when(knex.whereIn('post._id', ['1', '2'])).thenReturn(knex);
            testdouble_1.default.when(knex.select('post.*')).thenResolve(POSTS);
            const [primary, included] = yield adapter.find('posts', ['1', '2'], null, null, null, null);
            chai_1.expect(primary.resources).to.have.lengthOf(2);
            primary.resources.forEach((r, i) => {
                chai_1.expect(r.id).to.equal((i + 1).toString());
                chai_1.expect(r.attrs.title).to.equal(`Post ${i + 1}`);
                chai_1.expect(r.relationships.author.linkage.value.id).to.equal('1');
            });
            chai_1.expect(included.resources).to.have.lengthOf(0);
        });
    });
    it('finds a specific id', function () {
        return __awaiter(this, void 0, void 0, function* () {
            testdouble_1.default.when(knex.from('post')).thenReturn(knex);
            testdouble_1.default.when(knex.where('post._id', '1')).thenReturn(knex);
            testdouble_1.default.when(knex.select('post.*')).thenResolve(POSTS.slice(0, 1));
            const [primary, included] = yield adapter.find('posts', '1', null, null, null, null);
            chai_1.expect(primary).to.be.an.instanceOf(json_api_1.Resource);
            chai_1.expect(primary.id).to.equal('1');
            chai_1.expect(primary.attrs.title).to.equal(`Post 1`);
            chai_1.expect(primary.relationships.author.linkage.value.id).to.equal('1');
            chai_1.expect(included.resources).to.have.lengthOf(0);
        });
    });
    it('returns a sparse fieldset on the primary resource', function () {
        return __awaiter(this, void 0, void 0, function* () {
            testdouble_1.default.when(knex.from('post')).thenReturn(knex);
            testdouble_1.default.when(knex.select(['title', '_id'])).thenResolve(POSTS);
            const [primary, included] = yield adapter.find('posts', null, { posts: ['title'] }, null, null, null);
            chai_1.expect(primary.resources).to.have.lengthOf(2);
            primary.resources.forEach((r, i) => {
                chai_1.expect(r.id).to.equal((i + 1).toString());
                chai_1.expect(r.attrs.title).to.exist;
                chai_1.expect(r.attrs.date).to.not.exist;
                chai_1.expect(r.relationships.author).to.not.exist;
            });
            chai_1.expect(included.resources).to.have.lengthOf(0);
        });
    });
    it(`returns a sparse fieldset on the primary resource's relationships`, function () {
        return __awaiter(this, void 0, void 0, function* () {
            testdouble_1.default.when(knex.from('post')).thenReturn(knex);
            testdouble_1.default.when(knex.select(['author', '_id'])).thenResolve(POSTS.map(p => ({ _id: p._id, author: p.author })));
            const [primary, included] = yield adapter.find('posts', null, { posts: ['author'] }, null, null, null);
            chai_1.expect(primary.resources).to.have.lengthOf(2);
            primary.resources.forEach((r, i) => {
                chai_1.expect(r.id).to.equal((i + 1).toString());
                chai_1.expect(r.attrs.title).to.not.exist;
                chai_1.expect(r.attrs.date).to.not.exist;
                chai_1.expect(r.relationships.author).to.exist;
                chai_1.expect(r.relationships.author.linkage.value.id).to.exist;
            });
            chai_1.expect(included.resources).to.have.lengthOf(0);
        });
    });
    it.skip('returns a sparse fieldset on the included resource', function () {
        return __awaiter(this, void 0, void 0, function* () {
            testdouble_1.default.when(knex.from('post')).thenReturn(knex);
            testdouble_1.default.when(knex.select(['title'])).thenResolve(POSTS);
            const [primary, included] = yield adapter.find('posts', null, { author: ['name'] }, null, null, ['author']);
            chai_1.expect(primary.resources).to.have.lengthOf(2);
            primary.resources.forEach((r, i) => {
                chai_1.expect(r.id).to.equal((i + 1).toString());
                chai_1.expect(r.attrs.title).to.equal(`Post ${i + 1}`);
                chai_1.expect(r.relationships.author.linkage.value.id).to.equal('1');
            });
            chai_1.expect(included.resources).to.have.lengthOf(1);
            chai_1.expect(included[0].type).to.equal('author');
            chai_1.expect(included[0].id).to.equal('1');
            chai_1.expect(included[0].attrs).to.have.key('name');
            chai_1.expect(included[0].attrs).to.not.have.key('age');
        });
    });
    it('sorts the results', function () {
        return __awaiter(this, void 0, void 0, function* () {
            testdouble_1.default.when(knex.from('post')).thenReturn(knex);
            testdouble_1.default.when(knex.select('post.*')).thenReturn(knex);
            testdouble_1.default.when(knex.orderBy('post._id', 'desc')).thenResolve([POSTS[1], POSTS[0]]);
            const [primary, included] = yield adapter.find('posts', null, null, ['-id'], null, null);
            chai_1.expect(primary.resources).to.have.lengthOf(2);
            chai_1.expect(primary.resources[0].id).to.equal('2');
            chai_1.expect(primary.resources[1].id).to.equal('1');
            chai_1.expect(included.resources).to.have.lengthOf(0);
        });
    });
    it(`throws on sorts of attrs that aren't in the model`, function () {
        return __awaiter(this, void 0, void 0, function* () {
            testdouble_1.default.when(knex.from('post')).thenReturn(knex);
            testdouble_1.default.when(knex.select('post.*')).thenResolve(POSTS);
            try {
                yield adapter.find('posts', null, null, ['password'], null, null);
            }
            catch (err) {
                chai_1.expect(err).to.have.lengthOf(1);
                chai_1.expect(err[0]).to.be.an.instanceOf(json_api_1.Error);
                chai_1.expect(err[0].detail).to.include(`'password' does not exist`);
                return;
            }
            throw new Error('Expected bad sort to cause promise rejection');
        });
    });
    it('applies all sorts in order', function () {
        return __awaiter(this, void 0, void 0, function* () {
            testdouble_1.default.when(knex.from('post')).thenReturn(knex);
            testdouble_1.default.when(knex.select('post.*')).thenReturn(knex);
            testdouble_1.default.when(knex.orderBy('post.title', 'asc')).thenReturn(knex);
            testdouble_1.default.when(knex.orderBy('post._id', 'desc')).thenResolve(POSTS);
            const [primary, included] = yield adapter.find('posts', null, null, ['title', '-id'], null, null);
            chai_1.expect(primary.resources).to.have.lengthOf(2);
            chai_1.expect(primary.resources[0].id).to.equal('1');
            chai_1.expect(primary.resources[1].id).to.equal('2');
            chai_1.expect(included.resources).to.have.lengthOf(0);
        });
    });
    it('applies filters', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const date = new Date('2017-06-01');
            testdouble_1.default.when(knex.from('post')).thenReturn(knex);
            testdouble_1.default.when(knex.where('post.title', '=', 'Post 1')).thenReturn(knex);
            testdouble_1.default.when(knex.where('post.date', '<', testdouble_1.default.matchers.argThat(d => d.valueOf() === date.valueOf()))).thenReturn(knex);
            testdouble_1.default.when(knex.select('post.*')).thenResolve(POSTS.slice(0, 1));
            const [primary, included] = yield adapter.find('posts', null, null, null, { title: 'Post 1', date: { $lt: date } }, null);
            chai_1.expect(primary.resources).to.have.lengthOf(1);
            chai_1.expect(primary.resources[0].id).to.equal('1');
            chai_1.expect(included.resources).to.have.lengthOf(0);
        });
    });
    it('gives a nice error for non-object filters', function () {
        return __awaiter(this, void 0, void 0, function* () {
            testdouble_1.default.when(knex.from('post')).thenReturn(knex);
            testdouble_1.default.when(knex.select('post.*')).thenResolve(POSTS);
            try {
                yield adapter.find('posts', null, null, null, 'abc', null);
            }
            catch (err) {
                chai_1.expect(err.title).to.equal('Bad filter');
                chai_1.expect(err.detail).to.equal('Filters must be an object.');
                return;
            }
            throw new Error('Expected bad filter to cause promise rejection');
        });
    });
    it('gives a nice error for top-level operators', function () {
        return __awaiter(this, void 0, void 0, function* () {
            testdouble_1.default.when(knex.from('post')).thenReturn(knex);
            testdouble_1.default.when(knex.select('post.*')).thenResolve(POSTS);
            try {
                yield adapter.find('posts', null, null, null, { $or: [{ title: 'Post 1' }, { title: 'Post 2' }] }, null);
            }
            catch (err) {
                chai_1.expect(err.title).to.equal('Bad filter');
                chai_1.expect(err.detail).to.equal('Expected to find an attribute name, got $or. Logical operators are not supported.');
                return;
            }
            throw new Error('Expected bad filter to cause promise rejection');
        });
    });
    it('gives a nice error for unknown operators', function () {
        return __awaiter(this, void 0, void 0, function* () {
            testdouble_1.default.when(knex.from('post')).thenReturn(knex);
            testdouble_1.default.when(knex.select('post.*')).thenResolve(POSTS);
            try {
                yield adapter.find('posts', null, null, null, { title: { '<': 1 } }, null);
            }
            catch (err) {
                chai_1.expect(err.title).to.equal('Bad filter');
                chai_1.expect(err.detail).to.equal('Unknown operator <.');
                return;
            }
            throw new Error('Expected bad filter to cause promise rejection');
        });
    });
    it('returns an empty collection if no resources match', function () {
        return __awaiter(this, void 0, void 0, function* () {
            testdouble_1.default.when(knex.from('post')).thenReturn(knex);
            testdouble_1.default.when(knex.where('post.title', '=', 'Not a Title')).thenReturn(knex);
            testdouble_1.default.when(knex.select('post.*')).thenResolve([]);
            const [primary, included] = yield adapter.find('posts', null, null, null, { title: 'Not a Title' }, null);
            chai_1.expect(primary.resources).to.have.lengthOf(0);
            chai_1.expect(included.resources).to.have.lengthOf(0);
        });
    });
    it('throws 404 if no resources match a specific id', function () {
        return __awaiter(this, void 0, void 0, function* () {
            testdouble_1.default.when(knex.from('post')).thenReturn(knex);
            testdouble_1.default.when(knex.where('post._id', '123')).thenReturn(knex);
            testdouble_1.default.when(knex.select('post.*')).thenResolve([]);
            try {
                yield adapter.find('posts', '123', null, null, null, null);
            }
            catch (err) {
                chai_1.expect(err.status).to.equal('404');
                chai_1.expect(err.title).to.equal('Not found');
                return;
            }
            throw new Error('Expected missing resource in request for specific id to throw');
        });
    });
    it('throws 404 if no resources match a specific id', function () {
        return __awaiter(this, void 0, void 0, function* () {
            testdouble_1.default.when(knex.from('post')).thenReturn(knex);
            testdouble_1.default.when(knex.where('post._id', '123')).thenReturn(knex);
            testdouble_1.default.when(knex.select('post.*')).thenResolve([]);
            try {
                yield adapter.find('posts', '123', null, null, null, null);
            }
            catch (err) {
                chai_1.expect(err.status).to.equal('404');
                chai_1.expect(err.title).to.equal('Not found');
                return;
            }
            throw new Error('Expected missing resource in request for specific id to throw');
        });
    });
    it.skip('includes resources');
});
