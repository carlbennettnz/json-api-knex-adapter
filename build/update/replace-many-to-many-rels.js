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
const resources_to_rel_records_1 = require("../helpers/resources-to-rel-records");
function replaceManyToManyRels(resources, model, trx) {
    return __awaiter(this, void 0, void 0, function* () {
        const relRecords = resources_to_rel_records_1.default(resources, model);
        return yield Promise.all(Object.keys(relRecords).map((key) => __awaiter(this, void 0, void 0, function* () {
            const recordsForRel = relRecords[key];
            const rel = model.relationships.find(rel => rel.key === key);
            const resourceIds = resources
                .filter(res => key in res.relationships)
                .map(res => res.id);
            yield trx(rel.via.table)
                .delete()
                .where(rel.via.fk, 'in', resourceIds);
            yield trx(rel.via.table)
                .insert(recordsForRel);
        })));
    });
}
exports.default = replaceManyToManyRels;
