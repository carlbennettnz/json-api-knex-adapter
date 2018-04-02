"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const validate_models_1 = require("../../../src/helpers/validate-models");
const table = 'post';
const validate = model => validate_models_1.default({ posts: model });
const errorPrefix = 'Model Validation Error [posts]: ';
describe('validate models', function () {
    describe('table name', function () {
        it('accepts model with valid table name', function () {
            const model = { table };
            chai_1.expect(() => validate(model)).to.not.throw();
        });
        it('rejects non-string or empty table name', function () {
            const msg = errorPrefix + `Expected property 'table' to be of type String.`;
            chai_1.expect(() => validate({ table: null })).to.throw(msg);
            chai_1.expect(() => validate({ table: undefined })).to.throw(msg);
            chai_1.expect(() => validate({ table: 1 })).to.throw(msg);
            chai_1.expect(() => validate({ table: [] })).to.throw(msg);
            chai_1.expect(() => validate({ table: {} })).to.throw(msg);
            chai_1.expect(() => validate({ table: '' })).to.throw(errorPrefix + `Expected property 'table' to not be empty.`);
        });
        it('rejects missing table name', function () {
            chai_1.expect(() => validate({})).to.throw(errorPrefix + `Expected property 'table' to exist.`);
        });
    });
    describe('id key', function () {
        it('accepts valid idKey', function () {
            chai_1.expect(() => validate({ table, idKey: '_id' })).to.not.throw();
        });
        it('ignores missing idKey', function () {
            chai_1.expect(() => validate({ table })).to.not.throw();
        });
        it('rejects non-string or empty idKey', function () {
            const msg = `Expected property 'idKey' be of type String`;
            chai_1.expect(() => validate({ table, idKey: null })).to.throw(msg);
            chai_1.expect(() => validate({ table, idKey: undefined })).to.throw(msg);
            chai_1.expect(() => validate({ table, idKey: 123 })).to.throw(msg);
            chai_1.expect(() => validate({ table, idKey: [] })).to.throw(msg);
            chai_1.expect(() => validate({ table, idKey: {} })).to.throw(msg);
            chai_1.expect(() => validate({ table, idKey: '' })).to.throw(`Expected property 'idKey' to not be empty`);
        });
    });
    describe('attrs', function () {
        it('ignores missing attrs', function () {
            chai_1.expect(() => validate({ table })).to.not.throw();
            chai_1.expect(() => validate({ table, attrs: [] })).to.not.throw();
        });
        it('rejects if attrs is not an array', function () {
            const msg = `Expected 'attrs' property to be an array`;
            chai_1.expect(() => validate({ table, attrs: '123' })).to.throw(msg);
            chai_1.expect(() => validate({ table, attrs: {} })).to.throw(msg);
        });
        it('accepts string attrs', function () {
            chai_1.expect(() => validate({ table, attrs: ['a', 'b'] })).to.not.throw();
        });
        it('rejects empty string and non-string attrs', function () {
            chai_1.expect(() => validate({ table, attrs: ['a', ''] }))
                .to.throw(`Expected attr key name to have length > 0`);
            chai_1.expect(() => validate({ table, attrs: ['a', null] }))
                .to.throw(`All items in attrs array must be either strings or objects, found object`);
            chai_1.expect(() => validate({ table, attrs: ['a', 2] }))
                .to.throw(`All items in attrs array must be either strings or objects, found number`);
        });
        it('accepts object attrs with key field', function () {
            chai_1.expect(() => validate({ table, attrs: [{ key: 'a' }, { key: 'b' }] })).to.not.throw();
        });
        it('accepts object attrs with serialize fn', function () {
            chai_1.expect(() => validate({ table, attrs: [{ key: 'a', serialize: () => null }] })).to.not.throw();
        });
        it('accepts object attrs with deserialize fn', function () {
            chai_1.expect(() => validate({ table, attrs: [{ key: 'a', deserialize: () => null }] })).to.not.throw();
        });
        it('rejects object attrs without a key', function () {
            chai_1.expect(() => validate({ table, attrs: [{}] })).to.throw('Expected attr key name to be a string, found object');
        });
        it('rejects object attrs with invalid fields', function () {
            chai_1.expect(() => validate({ table, attrs: [{ key: 'a', serialize: 123 }] }))
                .to.throw(`Expected attr property 'serialize' to be either falsey or a function`);
            chai_1.expect(() => validate({ table, attrs: [{ key: 'a', deserialize: 123 }] }))
                .to.throw(`Expected attr property 'deserialize' to be either falsey or a function`);
            chai_1.expect(() => validate({ table, attrs: [{ key: 'a', other: 'x' }] }))
                .to.throw(`The property 'other' is not allowed in attribute definition objects.`);
        });
        it('accepts falsey serialize and deserialize fields', function () {
            chai_1.expect(() => validate({ table, attrs: [{ key: 'a', serialize: null }] })).to.not.throw();
            chai_1.expect(() => validate({ table, attrs: [{ key: 'a', deserialize: false }] })).to.not.throw();
        });
        it('accepts a mix of object and string attrs', function () {
            chai_1.expect(() => validate({ table, attrs: [{ key: 'a' }, 'b'] })).to.not.throw();
        });
        it('rejects repeated attr keys', function () {
            chai_1.expect(() => validate({ table, attrs: [{ key: 'a' }, 'a'] })).to.throw(`Property name 'a' is repeated`);
        });
    });
    describe('relationships', function () {
        it('ignores missing relationships', function () {
            chai_1.expect(() => validate({ table })).to.not.throw();
            chai_1.expect(() => validate({ table, relationships: [] })).to.not.throw();
        });
        it('rejects if relationships is not an array', function () {
            const msg = errorPrefix + `Expected property 'relationships' to be an Array.`;
            chai_1.expect(() => validate({ table, relationships: '123' })).to.throw(msg);
            chai_1.expect(() => validate({ table, relationships: {} })).to.throw(msg);
        });
        it('accepts relationships with keys and types', function () {
            chai_1.expect(() => validate({ table, relationships: [{ key: 'a', type: 'x' }] })).to.not.throw();
        });
        it('rejects repeated relationship keys', function () {
            chai_1.expect(() => validate({ table, relationships: [{ key: 'a', type: 'x' }, { key: 'a', type: 'y' }] })).to.throw(`Property name 'a' is repeated`);
        });
        it('accepts relationships via linking tables', function () {
            chai_1.expect(() => validate({ table, relationships: [{ key: 'a', type: 'x', via: { table: 'x', fk: 'a', pk: 'b' } }] })).to.not.throw();
        });
        it('rejects relationships via linking tables without all attributes', function () {
            chai_1.expect(() => validate({ table, relationships: [{ key: 'a', type: 'x', via: { fk: 'a', pk: 'b' } }] }))
                .to.throw(`Expected property 'table' in relationship via object to exist`);
            chai_1.expect(() => validate({ table, relationships: [{ key: 'a', type: 'x', via: { table: 'x', fk: 'a' } }] }))
                .to.throw(`Expected property 'pk' in relationship via object to exist`);
            chai_1.expect(() => validate({ table, relationships: [{ key: 'a', type: 'x', via: { table: 'x', pk: 'b' } }] }))
                .to.throw(`Expected property 'fk' in relationship via object to exist`);
        });
        it('accepts a mix of linked and normal relationships', function () {
            const linked = { key: 'b', type: 'x', via: { table: 'x', fk: 'a', pk: 'b' } };
            chai_1.expect(() => validate({ table, relationships: [{ key: 'a', type: 'x' }, linked] })).to.not.throw();
        });
        it('rejects linked and normal relationships with the same key', function () {
            const linked = { key: 'a', type: 'x', via: { table: 'x', fk: 'a', pk: 'b' } };
            chai_1.expect(() => validate({ table, relationships: [{ key: 'a', type: 'x' }, linked] })).to.throw(`Property name 'a' is repeated`);
        });
        it('rejects additional properties on a relationship object', function () {
            const normal = { key: 'a', type: 'x', x: 'y' };
            const normal2 = { key: 'a', type: 'x', x: 'y', y: 'y' };
            const linked = { key: 'a', type: 'x', via: { table: 'a', pk: 'b', fk: 'c', x: 'y' } };
            chai_1.expect(() => validate({ table, relationships: [normal] })).to.throw(`The property 'x' is not allowed in relationship objects`);
            chai_1.expect(() => validate({ table, relationships: [linked] })).to.throw(`The property 'x' is not allowed in relationship via objects`);
            chai_1.expect(() => validate({ table, relationships: [normal2] })).to.throw(`The properties 'x', 'y' are not allowed in relationship objects`);
        });
    });
    describe('overall', function () {
        it('rejects missing model', function () {
            chai_1.expect(() => validate(null)).to.throw('Expected model to be an object, found null');
            chai_1.expect(() => validate(undefined)).to.throw('Expected model to be an object, found undefined');
        });
        it('rejects repeated keys', function () {
            const msg = `Property name 'x' is repeated.`;
            chai_1.expect(() => validate({ table, attrs: ['x'], relationships: [{ key: 'x', type: 'y' }] })).to.throw(msg);
            chai_1.expect(() => validate({ table, attrs: [{ key: 'x' }], relationships: [{ key: 'x', type: 'y' }] })).to.throw(msg);
        });
        it('allows idKey to be repeated as an attr or relationship', function () {
            chai_1.expect(() => validate({ table, idKey: 'x', attrs: ['x'] })).to.not.throw();
            chai_1.expect(() => validate({ table, idKey: 'x', relationships: [{ key: 'x', type: 'y' }] })).to.not.throw();
        });
    });
});
