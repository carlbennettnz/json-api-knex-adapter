"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const fileNames = fs.readdirSync(`${__dirname}/fixtures`);
const filePromises = fileNames.filter(name => name.endsWith('.json')).map(name => {
    return new Promise((resolve, reject) => fs.readFile(`${__dirname}/fixtures/${name}`, 'utf8', (err, file) => err
        ? reject(err)
        : resolve([name.replace(/\.json$/i, ''), JSON.parse(file)])));
});
const fixturesPromise = Promise.all(filePromises);
function database(knex) {
    function load() {
        return __awaiter(this, void 0, void 0, function* () {
            const fixtures = yield fixturesPromise;
            return knex.transaction(trx => {
                const inserts = fixtures.map(([table, records]) => trx.insert(records).into(table));
                return Promise.all(inserts);
            });
        });
    }
    function clear() {
        return __awaiter(this, void 0, void 0, function* () {
            const tables = yield knex
                .from('pg_catalog.pg_tables')
                .select('tablename as table')
                .where('schemaname', 'public')
                .where('tablename', 'NOT LIKE', 'knex_%');
            const tableNames = tables.map(t => `"${t.table}"`);
            yield knex.raw(`TRUNCATE ${tableNames.join(', ')} CASCADE`);
        });
    }
    function close() {
        return __awaiter(this, void 0, void 0, function* () {
            return knex.destroy();
        });
    }
    return { load, clear, close };
}
exports.default = database;
