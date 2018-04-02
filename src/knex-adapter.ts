import {
  FindQuery,
  CreateQuery,
  UpdateQuery,
  DeleteQuery,
  AddToRelationshipQuery,
  RemoveFromRelationshipQuery,
  Resource,
  Data,
  Errors
} from 'json-api'

import {
  Adapter,
  TypeIdMapOf,
  TypeInfo
} from 'json-api/build/src/db-adapters/AdapterInterface'

import * as Knex from 'knex'
import * as debugFactory from 'debug';
import * as _ from 'lodash';

// Models
import normalizeModels from './models/normalize'
import { Models, StrictModels } from './models/model-interface'

// Finds
import applyRecordFilters from './find/apply-record-filters';
import applyFieldFilters from './find/apply-field-filters';
import getIncludedResources from './find/get-included-resources';
import joinToManyRelationships from './find/join-to-many-relationships';
import applySorts from './find/apply-sorts';

// Creates
import savePrimaryRecords from './create/save-primary-records';
import saveAndAssignManyToManyRels from './create/save-and-assign-many-to-many-rels';

// Updates
import updatePrimaryResources from './update/update-primary-resources';
import replaceManyToManyRelationships from './update/replace-many-to-many-rels';
import getAfterUpdateFindQuery from './update/get-after-update-find-query';

// Helpers
import withResourcesOfEachType from './helpers/with-resources-of-each-type';
import formatQuery from './helpers/format-query';
import { handleQueryError } from './helpers/errors';
import recordToResource from './helpers/record-to-resource';
import { validateResources, ensureOneToManyRelsAreNotPresent } from './helpers/validation';

const debug = debugFactory('json-api:knex-adapter');

export default class KnexAdapter implements Adapter<typeof KnexAdapter> {
  // Workaround for https://github.com/Microsoft/TypeScript/issues/3841.
  // Doing this makes our implements declaration work.
  "constructor": typeof KnexAdapter

  models: StrictModels;
  knex: Knex;

  constructor(models: Models, knex: Knex) {
    this.models = normalizeModels(models);
    this.knex = knex;
  }
  
  async find(query: FindQuery): Promise<[ Data<Resource>, Resource[] ]> {
    const model = this.models[query.type];
    const kq = this.knex.from(model.table);

    applyRecordFilters(kq, model, query.getFilters());

    const includedPromise = getIncludedResources(
      kq,
      query.populates,
      this.models,
      query.type
    );

    const selectedFields = (query.select && query.select[query.type]) || [];

    applyFieldFilters(kq, model, selectedFields);
    joinToManyRelationships(kq, model, selectedFields);
    applySorts(kq, model, query.sort);

    let records: any[];
    let included: Resource[];

    debug('executing query:');
    debug(formatQuery(kq));

    try {
      [ records, included ] = await Promise.all([ kq, includedPromise ]);
    } catch (err) {
      handleQueryError(err);
      throw err; // unreachable
    }

    // Convert the POJOs from Knex into json-api Resources
    const resources = records.map(
      record => recordToResource(record, query.type, model, selectedFields)
    );

    const primary: Data<Resource> = query.singular
      ? Data.pure<Resource>(resources[0])
      : Data.of<Resource>(resources);

    return [ primary, included ];
  }

  async create(query: CreateQuery): Promise<Data<Resource>> {
    const results = await withResourcesOfEachType(
      query.records,
      this.knex,
      this.models,
      async (trx, type, model, resourcesForType) => {
        validateResources(resourcesForType, model);
        ensureOneToManyRelsAreNotPresent(resourcesForType, model);

        const {
          primaryRecords,
          resourcesWithIds
        } = await savePrimaryRecords(resourcesForType, model, trx);

        await saveAndAssignManyToManyRels(resourcesWithIds, primaryRecords, model, trx);

        return primaryRecords.map(record => recordToResource(record, type, model));
      }
    );

    return query.records.isSingular
      ? Data.pure<Resource>(results[0])
      : Data.of<Resource>(results);
  }

  async update(query: UpdateQuery): Promise<any> {
    await withResourcesOfEachType(
      query.patch,
      this.knex,
      this.models,
      async (trx, type, model, resourcesForType) => {
        validateResources(resourcesForType, model);
        ensureOneToManyRelsAreNotPresent(resourcesForType, model);

        await updatePrimaryResources(resourcesForType, model, trx);
        await replaceManyToManyRelationships(resourcesForType, model, trx);

        return resourcesForType;
      }
    );

    const findQuery = getAfterUpdateFindQuery(query);

    return await this.find(findQuery)
      .then(([ primary ]) => primary);
  }
  
  async delete(query: DeleteQuery): Promise<any> {
    if (!query.isSimpleIdQuery()) {
      throw new Error('Only simple ID queries are supported');
    }

    const model = this.models[query.type];

    const numDeleted = await this.knex(model.table)
      .whereIn(model.idKey, query.getFilters().value.map(constraint => constraint.value as string))
      .delete();
    
    if (query.singular && numDeleted === 0) {
      throw Errors.genericNotFound();
    }
  }
  
  async addToRelationship(query: AddToRelationshipQuery): Promise<any> {

  }
  
  async removeFromRelationship(query: RemoveFromRelationshipQuery): Promise<any> {

  }
  
  getModel(typeName: string): any {

  }
  
  getRelationshipNames(typeName: string): string[] {
    return []
  }
  
  async doQuery(
    query: CreateQuery | FindQuery | UpdateQuery | DeleteQuery |
      AddToRelationshipQuery | RemoveFromRelationshipQuery
  ): Promise<any> {
    if (query instanceof CreateQuery) return this.create(query);
    if (query instanceof FindQuery) return this.find(query);
    if (query instanceof DeleteQuery) return this.delete(query);
    if (query instanceof UpdateQuery) return this.update(query);
    if (query instanceof AddToRelationshipQuery) return this.addToRelationship(query);
    if (query instanceof RemoveFromRelationshipQuery) return this.removeFromRelationship(query);
    
    throw new Error("Unexpected query type");
  }
  
  async getTypePaths(items: {type: string, id: string}[]): Promise<TypeIdMapOf<TypeInfo>> {
    const itemsByType: any = _.groupBy(items, 'type')
    const result: TypeIdMapOf<TypeInfo> = {}

    for (const type in itemsByType) {
      const typeMap = result[type] = {};

      for (const item of itemsByType[type]) {
        typeMap[item.id] = {
          typePath: [ item.type ]
        }
      }
    }
    
    return result
  }

  static getStandardizedSchema(model: any, pluralizer: any): any {

  }

  static unaryFilterOperators: string[] = ['and', 'or']
  static binaryFilterOperators: string[] = ['eq', 'neq', 'ne', 'in', 'nin', 'lt', 'gt', 'lte', 'gte']
};
