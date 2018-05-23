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
const resource_to_primary_record_1 = require("../helpers/resource-to-primary-record");
function savePrimaryRecords(resources, model, trx) {
    return __awaiter(this, void 0, void 0, function* () {
        const records = resources
            .map(res => resource_to_primary_record_1.default(res, model));
        const primaryRecords = yield trx
            .insert(records)
            .into(model.table)
            .returning('*');
        resources.forEach((resource, i) => {
            resource.id = primaryRecords[i][model.idKey];
        });
        return {
            primaryRecords,
            resourcesWithIds: resources
        };
    });
}
exports.default = savePrimaryRecords;
