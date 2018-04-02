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
const request = require("supertest");
const chai_1 = require("chai");
const get_app_instance_1 = require("../support/get-app-instance");
const database_1 = require("../support/database");
describe('integrated find', function () {
    let app, db;
    before(() => { app = get_app_instance_1.default(); });
    before(() => { db = database_1.default(app.connection); });
    beforeEach(() => db.clear());
    beforeEach(() => db.load());
    after(() => db.close());
    describe('collections', function () {
        it('uses types correctly', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield request(app)
                    .get('/posts')
                    .accept('application/vnd.api+json')
                    .expect(200);
                chai_1.expect(res.body.data).to.have.lengthOf(4);
                for (const r of res.body.data) {
                    chai_1.expect(r.type).to.equal('posts');
                }
            });
        });
        it('filters fields', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield request(app)
                    .get('/posts')
                    .query({ fields: { posts: 'title' } })
                    .accept('application/vnd.api+json')
                    .expect(200);
                chai_1.expect(res.body.data).to.have.lengthOf(4);
                for (const r of res.body.data) {
                    chai_1.expect(r.attributes.title).to.exist;
                    chai_1.expect(r.attributes.date).to.not.exist;
                }
            });
        });
        it('applies sorts', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield request(app)
                    .get('/posts')
                    .query({ sort: '-title,id' })
                    .accept('application/vnd.api+json')
                    .expect(200);
                chai_1.expect(res.body.data).to.have.lengthOf(4);
                chai_1.expect(res.body.data[0].id).to.equal('000000000000000000000003');
                chai_1.expect(res.body.data[1].id).to.equal('000000000000000000000004');
                chai_1.expect(res.body.data[2].id).to.equal('000000000000000000000002');
                chai_1.expect(res.body.data[3].id).to.equal('000000000000000000000001');
            });
        });
        it.skip('populates relationships with include', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield request(app)
                    .get('/posts')
                    .query({ include: 'author' })
                    .accept('application/vnd.api+json')
                    .expect(200);
                chai_1.expect(res.body.data).to.have.lengthOf(4);
                chai_1.expect(res.body.included).to.have.lengthOf(1);
                chai_1.expect(res.body.included[0].attributes.id).to.equal('000000000000000000000001');
            });
        });
        describe('filters', function () {
            it('applies basic equality filters', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    const res = yield request(app)
                        .get('/posts')
                        .query('filter=(title,Post 1)')
                        .expect(200);
                    chai_1.expect(res.body.data).to.have.lengthOf(1);
                    chai_1.expect(res.body.data[0].attributes.title).to.equal('Post 1');
                });
            });
            it('applies $in filters', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    const res = yield request(app)
                        .get('/posts')
                        .query('filter=(title,in,(Post 1,Post 2))')
                        .expect(200);
                    chai_1.expect(res.body.data).to.have.lengthOf(2);
                    chai_1.expect(res.body.data.find(r => r.id === '000000000000000000000001').attributes.title).to.equal('Post 1');
                    chai_1.expect(res.body.data.find(r => r.id === '000000000000000000000002').attributes.title).to.equal('Post 2');
                });
            });
            it('applies $nin filters', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    const res = yield request(app)
                        .get('/posts')
                        .query('filter=(title,nin,(Post 1,Post 2))')
                        .expect(200);
                    chai_1.expect(res.body.data).to.have.lengthOf(2);
                    chai_1.expect(res.body.data[0].attributes.title).to.equal('Post 4');
                    chai_1.expect(res.body.data[1].attributes.title).to.equal('Post 3');
                });
            });
            it('applies $lt filters', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    const res = yield request(app)
                        .get('/posts')
                        .query('filter=(title,lt,Post 2)')
                        .expect(200);
                    chai_1.expect(res.body.data).to.have.lengthOf(1);
                    chai_1.expect(res.body.data[0].attributes.title).to.equal('Post 1');
                });
            });
            it('applies $lte filters', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    const res = yield request(app)
                        .get('/posts')
                        .query('filter=(title,lte,Post 2)')
                        .expect(200);
                    chai_1.expect(res.body.data).to.have.lengthOf(2);
                    chai_1.expect(res.body.data.find(r => r.id === '000000000000000000000001').attributes.title).to.equal('Post 1');
                    chai_1.expect(res.body.data.find(r => r.id === '000000000000000000000002').attributes.title).to.equal('Post 2');
                });
            });
            it('applies $gt filters', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    const res = yield request(app)
                        .get('/posts')
                        .query('filter=(title,gt,Post 2)')
                        .expect(200);
                    chai_1.expect(res.body.data).to.have.lengthOf(2);
                    chai_1.expect(res.body.data.find(r => r.id === '000000000000000000000003').attributes.title).to.equal('Post 4');
                    chai_1.expect(res.body.data.find(r => r.id === '000000000000000000000004').attributes.title).to.equal('Post 3');
                });
            });
            it('applies $gte filters', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    const res = yield request(app)
                        .get('/posts')
                        .query('filter=(title,gte,Post 2)')
                        .expect(200);
                    chai_1.expect(res.body.data).to.have.lengthOf(3);
                    chai_1.expect(res.body.data.find(r => r.id === '000000000000000000000002').attributes.title).to.equal('Post 2');
                    chai_1.expect(res.body.data.find(r => r.id === '000000000000000000000003').attributes.title).to.equal('Post 4');
                    chai_1.expect(res.body.data.find(r => r.id === '000000000000000000000004').attributes.title).to.equal('Post 3');
                });
            });
            it('applies $eq filters', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    const res = yield request(app)
                        .get('/posts')
                        .query('filter=(title,eq,Post 2)')
                        .expect(200);
                    chai_1.expect(res.body.data).to.have.lengthOf(1);
                    chai_1.expect(res.body.data[0].attributes.title).to.equal('Post 2');
                });
            });
            it('applies $ne filters', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    const res = yield request(app)
                        .get('/posts')
                        .query('filter=(title,ne,Post 2)')
                        .expect(200);
                    chai_1.expect(res.body.data).to.have.lengthOf(3);
                    chai_1.expect(res.body.data.find(r => r.id === '000000000000000000000001').attributes.title).to.equal('Post 1');
                    chai_1.expect(res.body.data.find(r => r.id === '000000000000000000000003').attributes.title).to.equal('Post 4');
                    chai_1.expect(res.body.data.find(r => r.id === '000000000000000000000004').attributes.title).to.equal('Post 3');
                });
            });
            it('applies ordinal operators to dates', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    const res = yield request(app)
                        .get('/posts')
                        .query('filter=(date,lt,2017-07-15T00:00:00.000Z)')
                        .expect(200);
                    chai_1.expect(res.body.data).to.have.lengthOf(2);
                    chai_1.expect(res.body.data.find(r => r.id === '000000000000000000000001').attributes.title).to.equal('Post 1');
                    chai_1.expect(res.body.data.find(r => r.id === '000000000000000000000002').attributes.title).to.equal('Post 2');
                });
            });
            it(`doesn't care if $in value isn't an array`, function () {
                return __awaiter(this, void 0, void 0, function* () {
                    const res = yield request(app)
                        .get('/posts')
                        .query('filter=(title,in,Post 1)')
                        .expect(200);
                    chai_1.expect(res.body.data).to.have.lengthOf(1);
                    chai_1.expect(res.body.data[0].attributes.title).to.equal('Post 1');
                });
            });
        });
    });
    describe('single resources', function () {
        it('uses types correctly', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield request(app)
                    .get('/posts/000000000000000000000001')
                    .accept('application/vnd.api+json')
                    .expect(200);
                chai_1.expect(res.body.data.id).to.equal('000000000000000000000001');
                chai_1.expect(res.body.data.type).to.equal('posts');
            });
        });
        it('filters fields', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield request(app)
                    .get('/posts/000000000000000000000001')
                    .query({ fields: { posts: 'title' } })
                    .accept('application/vnd.api+json')
                    .expect(200);
                chai_1.expect(res.body.data.id).to.equal('000000000000000000000001');
                chai_1.expect(res.body.data.attributes.title).to.exist;
                chai_1.expect(res.body.data.attributes.date).to.not.exist;
            });
        });
        it('ignores sorts', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield request(app)
                    .get('/posts/000000000000000000000001')
                    .query({ sort: '-title,id' })
                    .accept('application/vnd.api+json')
                    .expect(200);
                chai_1.expect(res.body.data.id).to.equal('000000000000000000000001');
            });
        });
        it('ignores filters', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield request(app)
                    .get('/posts/000000000000000000000001')
                    .query({ 'filter[simple][title]': 'xyz' })
                    .accept('application/vnd.api+json')
                    .expect(200);
                chai_1.expect(res.body.data.id).to.equal('000000000000000000000001');
            });
        });
        it('includes all attributes', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield request(app)
                    .get('/posts/000000000000000000000001')
                    .accept('application/vnd.api+json')
                    .expect(200);
                const { attributes } = res.body.data;
                chai_1.expect(attributes.title).to.equal('Post 1');
                chai_1.expect(attributes.date).includes('2017-06-01');
            });
        });
        it('includes all local relationships', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield request(app)
                    .get('/posts/000000000000000000000001')
                    .accept('application/vnd.api+json')
                    .expect(200);
                const { data: author } = res.body.data.relationships.author;
                chai_1.expect(author.id).to.equal('000000000000000000000001');
            });
        });
        it('includes all linked relationships', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield request(app)
                    .get('/awards/000000000000000000000001')
                    .accept('application/vnd.api+json')
                    .expect(200);
                const { data: winner } = res.body.data.relationships.winner;
                const { data: runnerUp } = res.body.data.relationships.runnerUp;
                const { data: winnerTags } = res.body.data.relationships.winnerTags;
                const { data: runnerUpTags } = res.body.data.relationships.runnerUpTags;
                const winnerTagIds = winnerTags.map(t => t.id);
                chai_1.expect(winner.id).to.equal('000000000000000000000001');
                chai_1.expect(runnerUp.id).to.equal('000000000000000000000002');
                chai_1.expect(winnerTags).to.have.lengthOf(2);
                chai_1.expect(runnerUpTags).to.have.lengthOf(1);
                chai_1.expect(winnerTagIds).to.include('000000000000000000000001');
                chai_1.expect(winnerTagIds).to.include('000000000000000000000002');
                chai_1.expect(runnerUpTags[0].id).to.equal('000000000000000000000002');
            });
        });
        it('includes linked one-to-many relationships', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield request(app)
                    .get('/posts/000000000000000000000001')
                    .accept('application/vnd.api+json')
                    .expect(200);
                const { data: comments } = res.body.data.relationships.comments;
                chai_1.expect(comments).to.have.lengthOf(3);
            });
        });
    });
    describe('includes', function () {
        it('populates direct relationships', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield request(app)
                    .get('/posts')
                    .query({ include: 'author' })
                    .accept('application/vnd.api+json')
                    .expect(200);
                chai_1.expect(res.body.data).to.have.lengthOf(4);
                chai_1.expect(res.body.included).to.have.lengthOf(1);
                chai_1.expect(res.body.included[0].type).to.equal('authors');
                chai_1.expect(res.body.included[0].id).to.equal('000000000000000000000001');
            });
        });
        it('populates linked relationships', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield request(app)
                    .get('/posts')
                    .query({ include: 'tags' })
                    .accept('application/vnd.api+json')
                    .expect(200);
                chai_1.expect(res.body.data).to.have.lengthOf(4);
                chai_1.expect(res.body.included).to.have.lengthOf(2);
                for (const inc of res.body.included) {
                    chai_1.expect(inc.type).to.equal('tags');
                }
            });
        });
        it('populates direct and linked relationships together', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield request(app)
                    .get('/posts')
                    .query({ include: 'tags,author' })
                    .accept('application/vnd.api+json')
                    .expect(200);
                chai_1.expect(res.body.data).to.have.lengthOf(4);
                chai_1.expect(res.body.included).to.have.lengthOf(3);
                for (const inc of res.body.included) {
                    chai_1.expect(['tags', 'authors'].includes(inc.type)).to.be.ok;
                }
            });
        });
        it('populates multiple direct relationships of same type', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield request(app)
                    .get('/awards')
                    .query({ include: 'winner,runnerUp' })
                    .accept('application/vnd.api+json')
                    .expect(200);
                chai_1.expect(res.body.data).to.have.lengthOf(1);
                chai_1.expect(res.body.included).to.have.lengthOf(2);
            });
        });
        it('populates multiple linked relationships of same type', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield request(app)
                    .get('/awards')
                    .query({ include: 'winnerTags,runnerUpTags' })
                    .accept('application/vnd.api+json')
                    .expect(200);
                chai_1.expect(res.body.data).to.have.lengthOf(1);
                chai_1.expect(res.body.included).to.have.lengthOf(2);
            });
        });
        it('populates multiple direct and linked relationships together', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield request(app)
                    .get('/awards')
                    .query({ include: 'winner,runnerUp,winnerTags,runnerUpTags' })
                    .accept('application/vnd.api+json')
                    .expect(200);
                chai_1.expect(res.body.data).to.have.lengthOf(1);
                chai_1.expect(res.body.included).to.have.lengthOf(4);
            });
        });
    });
});
