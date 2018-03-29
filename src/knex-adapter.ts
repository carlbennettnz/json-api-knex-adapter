import {
  FindQuery,
  CreateQuery,
  UpdateQuery,
  DeleteQuery,
  AddToRelationshipQuery,
  RemoveFromRelationshipQuery
} from 'json-api'

import {
  Adapter,
  TypeIdMapOf,
  TypeInfo
} from 'json-api/build/src/db-adapters/AdapterInterface'

export default class KnexAdapter implements Adapter<typeof KnexAdapter> {
  // Workaround for https://github.com/Microsoft/TypeScript/issues/3841.
  // Doing this makes our implements declaration work.
  "constructor": typeof KnexAdapter

  constructor() {

  }
  
  async find(query: FindQuery): Promise<any> {

  }

  async create(query: CreateQuery): Promise<any> {

  }

  async update(update: UpdateQuery): Promise<any> {

  }
  
  async delete(query: DeleteQuery): Promise<any> {

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
  
  async doQuery(query: any): Promise<any> {

  }
  
  async getTypePaths(items: {type: string, id: string}[]): Promise<TypeIdMapOf<TypeInfo>> {
    return {}
  }

  static getStandardizedSchema(model: any, pluralizer: any): any {

  }

  static unaryFilterOperators: string[] = ['and', 'or']
  static binaryFilterOperators: string[] = ['eq', 'neq', 'ne', 'in', 'nin', 'lt', 'gt', 'lte', 'gte']
};
