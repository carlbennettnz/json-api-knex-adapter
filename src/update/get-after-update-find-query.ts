import { FindQuery, UpdateQuery } from "json-api";

export default function getAfterUpdateFindQuery(
  query: UpdateQuery
) {
  const findQueryOpts = {
    type: query.type,
    returning: query.returning
  };
  
  const ids = query.patch.map(res => res.id).unwrap() as string | string[];

  return new FindQuery(findQueryOpts).matchingIdOrIds(ids);
}
