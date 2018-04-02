import { Data, Resource } from "json-api";
import * as Knex from 'knex';
import { StrictModels, StrictModel } from "../models/model-interface";
import { groupBy, flatten } from 'lodash'

export default async function withResourcesOfEachType<T extends Resource, U extends Resource>(
  resourceData: Data<T>,
  knex: Knex,
  models: StrictModels,
  callback: (
    trx: Knex.Transaction,
    type: string,
    model: StrictModel,
    resourcesForType: T[]
  ) => Promise<U[]>
): Promise<U[]> {
  const resources = resourceData.isSingular
    ? [ resourceData.unwrap() as Resource ]
    : resourceData.unwrap() as Resource[];

  const byType = groupBy(resources, r => r.type);

  return await knex.transaction(trx => {
    const promises = Object.keys(byType).map(
      type => callback(trx, type, models[type], byType[type] as T[])
    );
    
    return Promise.all(promises).then(flatten);
  });
}
