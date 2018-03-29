import { QueryBuilder } from 'knex'

export default function formatQuery(query: QueryBuilder): string {
  return '\t' + query
    .toString()
    .replace(/ (\(?(?:select|from|[a-z]+ join|where|order by|group by|having|limit)) /g, '\n\t$1 ');
}
