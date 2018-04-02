"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model_interface_1 = require("../models/model-interface");
function resourcesToRelRecords(resources, model) {
    const links = {};
    const manyToManyRels = model.relationships
        .filter(rel => rel.relType === model_interface_1.RelType.MANY_TO_MANY);
    for (const resource of resources) {
        for (const rel of manyToManyRels) {
            if (!resource.relationships[rel.key])
                continue;
            links[rel.key] = resource.relationships[rel.key]
                .unwrapDataWith(it => it.id)
                .map(id => ({ [rel.via.pk]: id, [rel.via.fk]: resource.id }));
        }
    }
    return links;
}
exports.default = resourcesToRelRecords;
