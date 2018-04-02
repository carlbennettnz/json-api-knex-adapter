"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const knex_adapter_1 = require("../../src/knex-adapter");
describe('init', function () {
    it('validates the models provided', function () {
        chai_1.expect(() => new knex_adapter_1.default({ posts: null }, {}))
            .to.throw(`Model Validation Error [posts]: Expected model to be an object, found null.`);
        chai_1.expect(() => new knex_adapter_1.default({ posts: {} }, {}))
            .to.throw(`Model Validation Error [posts]: Expected property 'table' to exist.`);
    });
    it('checks you provide a knex client', function () {
        chai_1.expect(() => new knex_adapter_1.default({ posts: { table: 'post' } }, null))
            .to.throw(`A connected knex client is required.`);
    });
    it('works if you do everything right', function () {
        chai_1.expect(() => new knex_adapter_1.default({ posts: { table: 'post' } }, {})).to.not.throw();
    });
});
