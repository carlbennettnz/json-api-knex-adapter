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
const get_app_instance_1 = require("../support/get-app-instance");
const database_1 = require("../support/database");
const request = require("supertest");
const chai_1 = require("chai");
const POSTS = [{
        id: '000000000000000000000001',
        type: 'posts',
        attributes: { title: 'New Title 1' },
        relationships: { author: { data: null } }
    }, {
        id: '000000000000000000000002',
        type: 'posts',
        attributes: { title: 'New Title 2', date: new Date('2017-10-15') }
    }];
const POSTS_WITH_BAD_AUTHOR = [...POSTS, {
        id: '000000000000000000000003',
        type: 'posts',
        relationships: { author: { data: { id: '999', type: 'authors' } } }
    }];
const POSTS_WITH_REL_UPDATES = [{
        id: '000000000000000000000001',
        type: 'posts',
        attributes: {},
        relationships: { tags: { data: [] } }
    }, {
        id: '000000000000000000000001',
        type: 'posts',
        attributes: {},
        relationships: { comments: { data: [] } }
    }];
describe('integrated update', function () {
    let app, knex, db;
    before(() => app = get_app_instance_1.default());
    before(() => knex = app.connection);
    before(() => db = database_1.default(knex));
    beforeEach(() => db.clear());
    beforeEach(() => db.load());
    after(() => db.close());
    describe('single resources', function () {
        it('updates the resource', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const [postBefore] = yield knex('post').where('_id', '=', '000000000000000000000001');
                yield request(app)
                    .patch('/posts/000000000000000000000001')
                    .type('application/vnd.api+json')
                    .send({ data: POSTS[0] })
                    .expect(200);
                const [postAfter] = yield knex('post').where('_id', '=', '000000000000000000000001');
                chai_1.expect(postAfter).to.exist;
                chai_1.expect(postAfter.title).to.equal('New Title 1');
                chai_1.expect(postAfter.date.valueOf()).to.equal(postBefore.date.valueOf());
                chai_1.expect(postAfter.author).to.equal(null);
            });
        });
        it('returns the resources', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield request(app)
                    .patch('/posts/000000000000000000000001')
                    .type('application/vnd.api+json')
                    .send({ data: POSTS[0] })
                    .expect(200);
                chai_1.expect(res.body.data.id).to.equal('000000000000000000000001');
                chai_1.expect(res.body.data.attributes.title).to.equal('New Title 1');
                chai_1.expect(res.body.data.attributes.date).to.exist;
                chai_1.expect(res.body.data.relationships).to.exist;
                chai_1.expect(res.body.data.relationships.tags.data).to.have.lengthOf(2);
            });
        });
        it('ignores surplus fields', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield request(app)
                    .patch('/posts/000000000000000000000001')
                    .type('application/vnd.api+json')
                    .send({ data: Object.assign({}, POSTS[0], { abc: 123 }) })
                    .expect(200);
            });
        });
        it('updates many-to-many relationships', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const [{ count: preCount }] = yield knex('post_tag').where('post', '=', '000000000000000000000001').count();
                yield request(app)
                    .patch('/posts/000000000000000000000001')
                    .type('application/vnd.api+json')
                    .send({ data: POSTS_WITH_REL_UPDATES[0] })
                    .expect(200);
                const [{ count: postCount }] = yield knex('post_tag').where('post', '=', '000000000000000000000001').count();
                chai_1.expect(preCount).to.equal('2');
                chai_1.expect(postCount).to.equal('0');
            });
        });
        it('gives 403 forbidden when a user attempts to update one-to-many relationships', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const [{ count: preCount }] = yield knex('comment').where('post', '=', '000000000000000000000001').count();
                const res = yield request(app)
                    .patch('/posts/000000000000000000000001')
                    .type('application/vnd.api+json')
                    .send({ data: POSTS_WITH_REL_UPDATES[1] })
                    .expect(403);
                chai_1.expect(res.body.errors).to.have.lengthOf(1);
                chai_1.expect(res.body.errors[0].title).to.equal('Illegal update to one-to-many relationship');
                chai_1.expect(res.body.errors[0].paths.pointer).to.equal('/data/0/relationships/comments');
                const [{ count: postCount }] = yield knex('comment').where('post', '=', '000000000000000000000001').count();
                chai_1.expect(preCount).to.equal('3');
                chai_1.expect(postCount).to.equal('3');
            });
        });
    });
    describe('collections', function () {
        it('inserts the resources', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield request(app)
                    .patch('/posts')
                    .type('application/vnd.api+json')
                    .send({ data: POSTS })
                    .expect(200);
                const [post1, post2] = yield knex('post').whereIn('_id', ['000000000000000000000001', '000000000000000000000002']).orderBy('_id');
                chai_1.expect(post1).to.exist;
                chai_1.expect(post1.title).to.equal('New Title 1');
                chai_1.expect(post1.author).to.equal(null);
                chai_1.expect(post2).to.exist;
                chai_1.expect(post2.title).to.equal('New Title 2');
                chai_1.expect(post2.author).to.equal('000000000000000000000001');
            });
        });
        it('returns the resources', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield request(app)
                    .patch('/posts')
                    .type('application/vnd.api+json')
                    .send({ data: POSTS })
                    .expect(200);
                chai_1.expect(res.body.data[0].id).to.equal('000000000000000000000001');
                chai_1.expect(res.body.data[0].attributes.title).to.equal('New Title 1');
                chai_1.expect(res.body.data[0].attributes.date).to.exist;
                chai_1.expect(res.body.data[0].relationships).to.exist;
                chai_1.expect(res.body.data[0].relationships.tags.data).to.have.lengthOf(2);
                chai_1.expect(res.body.data[1].id).to.equal('000000000000000000000002');
                chai_1.expect(res.body.data[1].attributes.title).to.equal('New Title 2');
                chai_1.expect(res.body.data[1].attributes.date).to.exist;
                chai_1.expect(res.body.data[1].relationships.author).to.exist;
            });
        });
        it('ignores surplus fields', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield request(app)
                    .patch('/posts')
                    .type('application/vnd.api+json')
                    .send({ data: POSTS.map(p => (Object.assign({}, p, { abc: 123 }))) })
                    .expect(200);
            });
        });
        it('is atomic', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const pre = yield knex('post');
                yield request(app)
                    .patch('/posts')
                    .type('application/vnd.api+json')
                    .send({ data: POSTS_WITH_BAD_AUTHOR })
                    .expect(500);
                const post = yield knex('post');
                chai_1.expect(pre).deep.equals(post);
            });
        });
    });
});
