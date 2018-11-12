import { QueryBuilder } from "knex";

export default function applyPaginationLimits(query: QueryBuilder, limit?: number, offset?: number) {
  if (limit) {
    query.limit(limit)

    if (offset) {
      query.offset(offset);
    }
  }
}
