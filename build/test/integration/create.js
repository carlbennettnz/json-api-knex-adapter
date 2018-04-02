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
const OBJECT_ID_REGEX = /^[0-9a-f]{24}$/;
const POSTS = [{
        type: 'posts',
        attributes: { title: 'Post 5', date: new Date('2017-10-15') },
        relationships: { author: { data: { id: '000000000000000000000001', type: 'authors' } } }
    }, {
        type: 'posts',
        attributes: { title: 'Post 6', date: new Date('2017-10-15') }
    }, {
        type: 'posts',
        attributes: { title: 'Post 5', date: new Date('2017-10-15') },
        relationships: {
            author: { data: { id: '000000000000000000000001', type: 'authors' } },
            tags: { data: [{ id: '000000000000000000000001', type: 'tags' }] }
        }
    }];
const POSTS_WITH_BAD_AUTHOR = [...POSTS, {
        type: 'posts',
        relationships: { author: { data: { id: '000000000000000000000999', type: 'authors' } } }
    }];
const POST_WITH_COMMENTS = {
    type: 'posts',
    relationships: { comments: { data: [{ id: '000000000000000000000999', type: 'comments' }] } }
};
describe('integrated create', function () {
    let app, knex, db;
    before(() => { app = get_app_instance_1.default(); });
    before(() => { knex = app.connection; });
    before(() => { db = database_1.default(knex); });
    beforeEach(() => { db.clear(); });
    beforeEach(() => { db.load(); });
    after(() => db.close());
    describe('single resources', function () {
        it('inserts the resource', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield request(app)
                    .post('/posts')
                    .type('application/vnd.api+json')
                    .send({ data: POSTS[0] })
                    .expect(201);
                const [{ count }] = yield knex('post').count();
                chai_1.expect(count).to.equal('5');
            });
        });
        it('returns the resources', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield request(app)
                    .post('/posts')
                    .type('application/vnd.api+json')
                    .send({ data: POSTS[0] })
                    .expect(201);
                chai_1.expect(res.body.data.id).to.match(OBJECT_ID_REGEX);
                chai_1.expect(res.body.data.attributes.title).to.equal('Post 5');
                chai_1.expect(res.body.data.attributes.date).to.exist;
                chai_1.expect(res.body.data.relationships.author).to.exist;
            });
        });
        it('ignores surplus fields', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield request(app)
                    .post('/posts')
                    .type('application/vnd.api+json')
                    .send({ data: Object.assign({}, POSTS[0], { abc: 123 }) })
                    .expect(201);
            });
        });
        it('saves to-many relationships', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const result = yield request(app)
                    .post('/posts')
                    .type('application/vnd.api+json')
                    .send({ data: POSTS[2] })
                    .expect(201);
                chai_1.expect(result.body.data.relationships.tags).to.exist;
                chai_1.expect(result.body.data.relationships.tags.data).to.have.lengthOf(1);
            });
        });
        it('does not return to-many relationship if value relationship is empty', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const result = yield request(app)
                    .post('/posts')
                    .type('application/vnd.api+json')
                    .send({ data: Object.assign({}, POSTS[2], { relationships: { author: POSTS[2].relationships.author, tags: { data: [] } } }) })
                    .expect(201);
                chai_1.expect(result.body.data.relationships.tags).to.not.exist;
            });
        });
        it('forbids the creation of a resource with a one-to-many relationship', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const countPosts = () => knex('post').count().then(r => Number(r[0].count));
                const preCount = yield countPosts();
                const result = yield request(app)
                    .post('/posts')
                    .type('application/vnd.api+json')
                    .send({ data: POST_WITH_COMMENTS })
                    .expect(403);
                chai_1.expect(result.body.errors).to.have.lengthOf(1);
                chai_1.expect(result.body.errors[0].title).to.equal('Illegal update to one-to-many relationship');
                chai_1.expect(result.body.errors[0].paths.pointer).to.equal('/data/0/relationships/comments');
                const postCount = yield countPosts();
                chai_1.expect(postCount).to.equal(preCount, 'no post added');
            });
        });
    });
    describe('collections', function () {
        it('inserts the resources', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield request(app)
                    .post('/posts')
                    .type('application/vnd.api+json')
                    .send({ data: POSTS })
                    .expect(201);
                const [{ count }] = yield knex('post').count();
                chai_1.expect(count).to.equal('7');
            });
        });
        it('returns the resources', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield request(app)
                    .post('/posts')
                    .type('application/vnd.api+json')
                    .send({ data: POSTS })
                    .expect(201);
                chai_1.expect(res.body.data[0].id).to.match(OBJECT_ID_REGEX);
                chai_1.expect(res.body.data[0].attributes.title).to.equal('Post 5');
                chai_1.expect(res.body.data[0].attributes.date).to.exist;
                chai_1.expect(res.body.data[0].relationships.author).to.exist;
                chai_1.expect(res.body.data[1].id).to.match(OBJECT_ID_REGEX);
                chai_1.expect(res.body.data[1].attributes.title).to.equal('Post 6');
                chai_1.expect(res.body.data[1].attributes.date).to.exist;
                chai_1.expect(res.body.data[1].relationships).to.not.exist;
            });
        });
        it('ignores surplus fields', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield request(app)
                    .post('/posts')
                    .type('application/vnd.api+json')
                    .send({ data: POSTS.map(p => (Object.assign({}, p, { abc: 123 }))) })
                    .expect(201);
            });
        });
        it('is atomic', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const [{ count: pre }] = yield knex('post').count();
                yield request(app)
                    .post('/posts')
                    .type('application/vnd.api+json')
                    .send({ data: POSTS_WITH_BAD_AUTHOR })
                    .expect(500);
                const [{ count: post }] = yield knex('post').count();
                chai_1.expect(pre).equals(post);
            });
        });
    });
});
