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
const lodash_1 = require("lodash");
const resources_to_rel_records_1 = require("../helpers/resources-to-rel-records");
function saveAndAssignManyToManyRels(resources, primaryRecords, model, trx) {
    return __awaiter(this, void 0, void 0, function* () {
        const relRecords = resources_to_rel_records_1.default(resources, model);
        const savedRelRecords = yield Promise.all(Object.keys(relRecords).map(key => {
            const rel = model.relationships.find(rel => rel.key === key);
            return trx
                .insert(relRecords[key])
                .into(rel.via.table)
                .returning('*')
                .then(inserted => inserted.map(record => ({ rel, record })));
        })).then(lodash_1.flatten);
        for (const { rel, record: relRecord } of savedRelRecords) {
            const primary = primaryRecords.find(primary => primary[model.idKey] === relRecord[rel.via.fk]);
            if (!primary[rel.key]) {
                primary[rel.key] = [];
            }
            primary[rel.key].push(relRecord[rel.via.pk]);
        }
    });
}
exports.default = saveAndAssignManyToManyRels;
