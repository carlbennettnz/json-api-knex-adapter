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
function updatePrimaryResources(resources, model, trx) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield Promise.all(resources.map(resource => {
            const record = resource_to_primary_record_1.default(resource, model);
            return trx(model.table)
                .where(model.idKey, resource.id)
                .update(record);
        }));
    });
}
exports.default = updatePrimaryResources;
