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
describe('integrated delete', function () {
    let app, knex, db;
    before(() => app = get_app_instance_1.default());
    before(() => knex = app.connection);
    before(() => db = database_1.default(knex));
    beforeEach(() => db.clear());
    beforeEach(() => db.load());
    after(() => db.close());
    describe('single resources', function () {
        it('deletes the resource and returns 204', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const [{ count: precount }] = yield knex('post').count('*').where('_id', '000000000000000000000001');
                yield request(app)
                    .delete('/posts/000000000000000000000001')
                    .expect(204);
                const [{ count: postcount }] = yield knex('post').count('*').where('_id', '000000000000000000000001');
                chai_1.expect(precount).to.equal('1');
                chai_1.expect(postcount).to.equal('0');
            });
        });
        it('fails to delete missing resource', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield request(app)
                    .delete('/posts/000000000000000000000999')
                    .expect(404);
                chai_1.expect(res.body.errors[0].title).to.equal('No matching resource found');
            });
        });
    });
    describe('collections', function () {
        it.skip('deletes the resources and return 204');
        it.skip(`doesn't care if the resources don't exist`);
    });
});
