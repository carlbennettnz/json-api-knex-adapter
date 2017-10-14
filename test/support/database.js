const fs = require('fs');

const fileNames = fs.readdirSync(`${__dirname}/fixtures`);
const filePromises = fileNames.filter(name => name.endsWith('.json')).map(name => {
  return new Promise((resolve, reject) =>
    fs.readFile(`${__dirname}/fixtures/${name}`, 'utf8', (err, file) => err
      ? reject(err)
      : resolve([ name.replace(/\.json$/i, ''), JSON.parse(file) ]))
  );
});
const fixturesPromise = Promise.all(filePromises);

function database(knex) {
  async function load() {
    const fixtures = await fixturesPromise;
    return knex.transaction(trx => {
      const inserts = fixtures.map(([ table, records ]) => trx.insert(records).into(table));
      return Promise.all(inserts);
    });
  }

  async function clear() {
    const fixtures = await fixturesPromise;
    const wipes = fixtures.map(([ table ]) => knex.delete().from(table));
    return Promise.all(wipes);
  }

  async function close() {
    return knex.destroy();
  }

  return { load, clear, close };
};

module.exports = database;