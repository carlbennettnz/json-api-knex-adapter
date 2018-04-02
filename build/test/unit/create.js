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
const testdouble_1 = require("testdouble");
const RealKnex = require("knex");
const json_api_1 = require("json-api");
const knex_adapter_1 = require("../../src/knex-adapter");
const result_types_1 = require("../../src/helpers/result-types");
const normalize_models_1 = require("../../src/helpers/normalize-models");
const realKnex = RealKnex({ client: 'pg' });
const models = normalize_models_1.default({
    posts: {
        table: 'post',
        idKey: '_id',
        attrs: [{ key: 'title' }],
        relationships: [{ type: 'authors', key: 'author' }]
    }
});
const knex = testdouble_1.default.object({ transaction: realKnex.transaction });
const POSTS = result_types_1.recordsToCollection([{ title: 'Post 1', author: 1 }, { title: 'Post 2', author: 1 }], 'posts', models.posts);
const POSTS_WITH_IDS = result_types_1.recordsToCollection([{ _id: 1, title: 'Post 1', author: 1 }, { _id: 2, title: 'Post 2', author: 1 }], 'posts', models.posts);
const adapter = new knex_adapter_1.default(models, knex);
describe('create', function () {
    afterEach(testdouble_1.default.reset);
    it('saves single resources', function () {
        return __awaiter(this, void 0, void 0, function* () {
            testdouble_1.default.when(knex.transaction(testdouble_1.default.matchers.isA(Function))).thenDo(cb => {
                const trx = testdouble_1.default.object();
                testdouble_1.default.when(trx.insert(testdouble_1.default.matchers.anything())).thenReturn(trx);
                testdouble_1.default.when(trx.into('post')).thenReturn(trx);
                testdouble_1.default.when(trx.returning('*')).thenResolve([{ _id: 5, title: 'Post 5', author: 1, date: new Date() }]);
                return cb(trx).then(() => POSTS_WITH_IDS.resources.slice(0, 1));
            });
            const result = yield adapter.create('posts', POSTS.resources[0]);
            chai_1.expect(result).to.be.an.instanceOf(json_api_1.Resource);
            chai_1.expect(result.id).to.a('string');
            chai_1.expect(result.id).to.equal('1');
            chai_1.expect(Object.keys(result.attrs)).to.have.lengthOf(1);
            chai_1.expect(result.attrs.title).to.be.a('string');
            chai_1.expect(result.attrs.title).to.equal('Post 1');
            chai_1.expect(Object.keys(result.relationships)).to.have.lengthOf(1);
            const rel = result.relationships.author;
            chai_1.expect(rel).to.be.instanceOf(json_api_1.Relationship);
            chai_1.expect(rel.linkage).to.be.instanceOf(json_api_1.Linkage);
            chai_1.expect(rel.linkage.value.type).to.equal('authors');
            chai_1.expect(rel.linkage.value.id).to.be.a('string');
            chai_1.expect(rel.linkage.value.id).to.equal('1');
        });
    });
    it('saves collections of resources of same type', function () {
        return __awaiter(this, void 0, void 0, function* () {
            testdouble_1.default.when(knex.transaction(testdouble_1.default.matchers.isA(Function))).thenDo(cb => {
                const trx = testdouble_1.default.object();
                testdouble_1.default.when(trx.insert(testdouble_1.default.matchers.anything())).thenReturn(trx);
                testdouble_1.default.when(trx.into('post')).thenReturn(trx);
                testdouble_1.default.when(trx.returning('*')).thenResolve([
                    { _id: 5, title: 'Post 5', author: 1, date: new Date() },
                    { _id: 6, title: 'Post 6', author: null, date: new Date() }
                ]);
                return cb(trx).then(() => POSTS_WITH_IDS.resources);
            });
            const result = yield adapter.create('posts', POSTS);
            chai_1.expect(result).to.be.instanceOf(json_api_1.Collection);
            chai_1.expect(result.resources).to.have.lengthOf(2);
            result.resources.forEach((r, i) => {
                chai_1.expect(r).to.be.an.instanceOf(json_api_1.Resource);
                chai_1.expect(r.id).to.a('string');
                chai_1.expect(r.id).to.equal((i + 1).toString());
                chai_1.expect(Object.keys(r.attrs)).to.have.lengthOf(1);
                chai_1.expect(r.attrs.title).to.be.a('string');
                chai_1.expect(r.attrs.title).to.equal(`Post ${i + 1}`);
                chai_1.expect(Object.keys(r.relationships)).to.have.lengthOf(1);
                const rel = r.relationships.author;
                chai_1.expect(rel).to.be.instanceOf(json_api_1.Relationship);
                chai_1.expect(rel.linkage).to.be.instanceOf(json_api_1.Linkage);
                chai_1.expect(rel.linkage.value.type).to.equal('authors');
                chai_1.expect(rel.linkage.value.id).to.be.a('string');
                chai_1.expect(rel.linkage.value.id).to.equal('1');
            });
        });
    });
    it.skip('errors on surplus fields');
    it.skip('gives nice validation errors');
});
