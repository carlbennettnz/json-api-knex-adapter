/// <reference types="knex" />
import { FindQuery, CreateQuery, UpdateQuery, DeleteQuery, AddToRelationshipQuery, RemoveFromRelationshipQuery, Resource, Data } from 'json-api';
import { Adapter, TypeIdMapOf, TypeInfo } from 'json-api/build/src/db-adapters/AdapterInterface';
import * as Knex from 'knex';
import { Models, StrictModels } from './models/model-interface';
export default class KnexAdapter implements Adapter<typeof KnexAdapter> {
    "constructor": typeof KnexAdapter;
    models: StrictModels;
    knex: Knex;
    constructor(models: Models, knex: Knex);
    find(query: FindQuery): Promise<[Data<Resource>, Resource[]]>;
    create(query: CreateQuery): Promise<Data<Resource>>;
    update(query: UpdateQuery): Promise<any>;
    delete(query: DeleteQuery): Promise<any>;
    addToRelationship(query: AddToRelationshipQuery): Promise<any>;
    removeFromRelationship(query: RemoveFromRelationshipQuery): Promise<any>;
    getModel(typeName: string): any;
    getRelationshipNames(typeName: string): string[];
    doQuery(query: CreateQuery | FindQuery | UpdateQuery | DeleteQuery | AddToRelationshipQuery | RemoveFromRelationshipQuery): Promise<any>;
    getTypePaths(items: {
        type: string;
        id: string;
    }[]): Promise<TypeIdMapOf<TypeInfo>>;
    static getStandardizedSchema(model: any, pluralizer: any): any;
    static unaryFilterOperators: string[];
    static binaryFilterOperators: string[];
}
