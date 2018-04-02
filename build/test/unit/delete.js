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
const json_api_1 = require("json-api");
const knex_adapter_1 = require("../../src/knex-adapter");
const normalize_models_1 = require("../../src/helpers/normalize-models");
const models = normalize_models_1.default({
    posts: {
        table: 'post',
        idKey: '_id',
        attrs: ['title'],
        relationships: [{ type: 'authors', key: 'author' }]
    }
});
const knex = testdouble_1.default.object();
const adapter = new knex_adapter_1.default(models, knex);
describe('delete', function () {
    afterEach(testdouble_1.default.reset);
    it('single resource, deleted', function () {
        return __awaiter(this, void 0, void 0, function* () {
            testdouble_1.default.when(knex.from('post')).thenReturn(knex);
            testdouble_1.default.when(knex.whereIn('_id', ['1'])).thenReturn(knex);
            testdouble_1.default.when(knex.delete()).thenResolve(1);
            const result = yield adapter.delete('posts', '1');
            chai_1.expect(result).to.be.undefined;
        });
    });
    it('single resource, not found', function () {
        return __awaiter(this, void 0, void 0, function* () {
            testdouble_1.default.when(knex.from('post')).thenReturn(knex);
            testdouble_1.default.when(knex.whereIn('_id', ['1'])).thenReturn(knex);
            testdouble_1.default.when(knex.delete()).thenResolve(0);
            try {
                yield adapter.delete('posts', '1');
            }
            catch (err) {
                chai_1.expect(err).to.be.an.instanceOf(json_api_1.Error);
                chai_1.expect(err.title).to.equal('No matching resource found');
                return;
            }
            throw new Error('Expected no matched resources to cause operation to reject with APIError');
        });
    });
    it('multiple resources, partially deleted', function () {
        return __awaiter(this, void 0, void 0, function* () {
            testdouble_1.default.when(knex.from('post')).thenReturn(knex);
            testdouble_1.default.when(knex.whereIn('_id', ['1', '2'])).thenReturn(knex);
            testdouble_1.default.when(knex.delete()).thenResolve(1);
            const result = yield adapter.delete('posts', ['1', '2']);
            chai_1.expect(result).to.be.undefined;
        });
    });
    it('multiple resources, not found', function () {
        return __awaiter(this, void 0, void 0, function* () {
            testdouble_1.default.when(knex.from('post')).thenReturn(knex);
            testdouble_1.default.when(knex.whereIn('_id', ['1', '2'])).thenReturn(knex);
            testdouble_1.default.when(knex.delete()).thenResolve(0);
            const result = yield adapter.delete('posts', ['1', '2']);
            chai_1.expect(result).to.be.undefined;
        });
    });
});
