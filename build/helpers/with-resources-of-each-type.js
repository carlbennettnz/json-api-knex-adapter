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
function withResourcesOfEachType(resourceData, knex, models, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        const resources = resourceData.isSingular
            ? [resourceData.unwrap()]
            : resourceData.unwrap();
        const byType = lodash_1.groupBy(resources, r => r.type);
        return yield knex.transaction(trx => {
            const promises = Object.keys(byType).map(type => callback(trx, type, models[type], byType[type]));
            return Promise.all(promises).then(lodash_1.flatten);
        });
    });
}
exports.default = withResourcesOfEachType;
