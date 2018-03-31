import { QueryBuilder, Knex } from "knex";

export function getKnexFromQuery(query: QueryBuilder): Knex {
  // query.client isn't in the types, but it definitely exists. Maybe private?
  return (<any>query).client.makeKnex((<any>query).client);
}
