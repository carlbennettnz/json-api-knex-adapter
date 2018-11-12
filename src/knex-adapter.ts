import {
  FindQuery,
  CreateQuery,
  UpdateQuery,
  DeleteQuery,
  AddToRelationshipQuery,
  RemoveFromRelationshipQuery,
  Data,
  Errors
} from 'json-api'

import {
  Adapter,
  TypeIdMapOf,
  TypeInfo,
  FindReturning,
  CreationReturning,
  ReturnedResource,
  UpdateReturning,
  DeletionReturning
} from 'json-api/build/src/db-adapters/AdapterInterface'

import * as Knex from 'knex'
import * as debugFactory from 'debug';
import * as _ from 'lodash';

// Models
import normalizeModels from './models/normalize'
import { Models, StrictModels } from './models/model-interface'

// Finds
import applyRecordFilters, { SUPPORTED_OPERATORS } from './find/apply-record-filters';
import applyPaginationLimits from './find/apply-pagination-limits';
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

  // { eq: {}, lt: {}, ... }
  static supportedOperators = SUPPORTED_OPERATORS
    .reduce((map, op) => ({ ...map, [op]: {} }), {});

  models: StrictModels;
  knex: Knex;

  constructor(models: Models, knex: Knex) {
    this.models = normalizeModels(models);
    this.knex = knex;
  }
  
  async find(query: FindQuery): Promise<FindReturning> {
    const model = this.models[query.type];
    const kq = this.knex.from(model.table);

    applyRecordFilters(kq, model, query.getFilters());
    applyPaginationLimits(kq, query.limit, query.offset);

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
    let included: ReturnedResource[];

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

    const primary = query.isSingular
      ? Data.pure<ReturnedResource>(resources[0])
      : Data.of<ReturnedResource>(resources);

    return { primary, included, collectionSize: undefined };
  }

  async create(query: CreateQuery): Promise<CreationReturning> {
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

    const created = query.records.isSingular
      ? Data.pure<ReturnedResource>(results[0])
      : Data.of<ReturnedResource>(results);
    
    return { created };
  }

  async update(query: UpdateQuery): Promise<UpdateReturning> {
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
    const updated = (await this.find(findQuery)).primary;
    
    return { updated }
  }
  
  async delete(query: DeleteQuery): Promise<DeletionReturning> {
    if (!query.isSimpleIdQuery()) {
      throw new Error('Only simple ID queries are supported');
    }

    const model = this.models[query.type];
    const kq = this.knex(model.table).delete();
    
    applyRecordFilters(kq, model, query.getFilters())

    const numDeleted = await kq;

    if (query.isSingular && numDeleted === 0) {
      throw Errors.genericNotFound();
    }

    return { deleted: undefined }
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
};
