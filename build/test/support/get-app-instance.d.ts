/// <reference types="knex" />
import * as knex from 'knex';
export interface ExpressWithConn extends Express.Application {
    connection: knex;
}
declare function getAppInstance(): ExpressWithConn;
export default getAppInstance;
