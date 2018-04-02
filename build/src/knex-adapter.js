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
const json_api_1 = require("json-api");
const debugFactory = require("debug");
const normalize_1 = require("./models/normalize");
const apply_record_filters_1 = require("./find/apply-record-filters");
const apply_field_filters_1 = require("./find/apply-field-filters");
const get_included_resources_1 = require("./find/get-included-resources");
const join_to_many_relationships_1 = require("./find/join-to-many-relationships");
const apply_sorts_1 = require("./find/apply-sorts");
const save_primary_records_1 = require("./create/save-primary-records");
const save_and_assign_many_to_many_rels_1 = require("./create/save-and-assign-many-to-many-rels");
const update_primary_resources_1 = require("./update/update-primary-resources");
const replace_many_to_many_rels_1 = require("./update/replace-many-to-many-rels");
const get_after_update_find_query_1 = require("./update/get-after-update-find-query");
const with_resources_of_each_type_1 = require("./helpers/with-resources-of-each-type");
const format_query_1 = require("./helpers/format-query");
const errors_1 = require("./helpers/errors");
const record_to_resource_1 = require("./helpers/record-to-resource");
const validation_1 = require("./helpers/validation");
const debug = debugFactory('json-api:knex-adapter');
class KnexAdapter {
    constructor(models, knex) {
        this.models = normalize_1.default(models);
        this.knex = knex;
    }
    find(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const model = this.models[query.type];
            const kq = this.knex.from(model.table);
            apply_record_filters_1.default(kq, model, query.getFilters());
            const includedPromise = get_included_resources_1.default(kq, query.populates, this.models, query.type);
            const selectedFields = (query.select && query.select[query.type]) || [];
            apply_field_filters_1.default(kq, model, selectedFields);
            join_to_many_relationships_1.default(kq, model, selectedFields);
            apply_sorts_1.default(kq, model, query.sort);
            let records;
            let included;
            debug('executing query:');
            debug(format_query_1.default(kq));
            try {
                [records, included] = yield Promise.all([kq, includedPromise]);
            }
            catch (err) {
                errors_1.handleQueryError(err);
                throw err;
            }
            const resources = records.map(record => record_to_resource_1.default(record, query.type, model, selectedFields));
            const primary = query.singular
                ? json_api_1.Data.pure(resources[0])
                : json_api_1.Data.of(resources);
            return [primary, included];
        });
    }
    create(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = yield with_resources_of_each_type_1.default(query.records, this.knex, this.models, (trx, type, model, resourcesForType) => __awaiter(this, void 0, void 0, function* () {
                validation_1.validateResources(resourcesForType, model);
                validation_1.ensureOneToManyRelsAreNotPresent(resourcesForType, model);
                const { primaryRecords, resourcesWithIds } = yield save_primary_records_1.default(resourcesForType, model, trx);
                yield save_and_assign_many_to_many_rels_1.default(resourcesWithIds, primaryRecords, model, trx);
                return primaryRecords.map(record => record_to_resource_1.default(record, type, model));
            }));
            return query.records.isSingular
                ? json_api_1.Data.pure(results[0])
                : json_api_1.Data.of(results);
        });
    }
    update(query) {
        return __awaiter(this, void 0, void 0, function* () {
            yield with_resources_of_each_type_1.default(query.patch, this.knex, this.models, (trx, type, model, resourcesForType) => __awaiter(this, void 0, void 0, function* () {
                validation_1.validateResources(resourcesForType, model);
                validation_1.ensureOneToManyRelsAreNotPresent(resourcesForType, model);
                yield update_primary_resources_1.default(resourcesForType, model, trx);
                yield replace_many_to_many_rels_1.default(resourcesForType, model, trx);
                return resourcesForType;
            }));
            const findQuery = get_after_update_find_query_1.default(query);
            return this.find(findQuery);
        });
    }
    delete(query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!query.isSimpleIdQuery()) {
                throw new Error('Only simple ID queries are supported');
            }
            const model = this.models[query.type];
            const numDeleted = yield this.knex(model.table)
                .whereIn(model.idKey, query.getFilters().value.map(constraint => constraint.value))
                .delete();
            if (query.singular && numDeleted === 0) {
                throw json_api_1.Errors.genericNotFound();
            }
        });
    }
    addToRelationship(query) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    removeFromRelationship(query) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    getModel(typeName) {
    }
    getRelationshipNames(typeName) {
        return [];
    }
    doQuery(query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (query instanceof json_api_1.CreateQuery)
                return this.create(query);
            if (query instanceof json_api_1.FindQuery)
                return this.find(query);
            if (query instanceof json_api_1.DeleteQuery)
                return this.delete(query);
            if (query instanceof json_api_1.UpdateQuery)
                return this.update(query);
            if (query instanceof json_api_1.AddToRelationshipQuery)
                return this.addToRelationship(query);
            if (query instanceof json_api_1.RemoveFromRelationshipQuery)
                return this.removeFromRelationship(query);
            throw new Error("Unexpected query type");
        });
    }
    getTypePaths(items) {
        return __awaiter(this, void 0, void 0, function* () {
            return {};
        });
    }
    static getStandardizedSchema(model, pluralizer) {
    }
}
KnexAdapter.unaryFilterOperators = ['and', 'or'];
KnexAdapter.binaryFilterOperators = ['eq', 'neq', 'ne', 'in', 'nin', 'lt', 'gt', 'lte', 'gte'];
exports.default = KnexAdapter;
;
