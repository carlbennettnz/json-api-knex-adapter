import * as knex from "knex";

export function getKnexFromQuery(query: knex.QueryBuilder): knex {
  // query.client isn't in the types, but it definitely exists. Maybe private?
  return (<any>query).client.makeKnex((<any>query).client);
}
