export default async function getCollectionSize(query) {
  const result = await query.count().first();
  return parseInt(result.count, 10);
}
