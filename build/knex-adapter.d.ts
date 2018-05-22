/// <reference types="knex" />
import { FindQuery, CreateQuery, UpdateQuery, DeleteQuery, AddToRelationshipQuery, RemoveFromRelationshipQuery } from 'json-api';
import { Adapter, TypeIdMapOf, TypeInfo, FindReturning, CreationReturning, UpdateReturning, DeletionReturning } from 'json-api/build/src/db-adapters/AdapterInterface';
import * as Knex from 'knex';
import { Models, StrictModels } from './models/model-interface';
export default class KnexAdapter implements Adapter<typeof KnexAdapter> {
    "constructor": typeof KnexAdapter;
    static supportedOperators: {};
    models: StrictModels;
    knex: Knex;
    constructor(models: Models, knex: Knex);
    find(query: FindQuery): Promise<FindReturning>;
    create(query: CreateQuery): Promise<CreationReturning>;
    update(query: UpdateQuery): Promise<UpdateReturning>;
    delete(query: DeleteQuery): Promise<DeletionReturning>;
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
