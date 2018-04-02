declare function database(knex: any): {
    load: () => Promise<any>;
    clear: () => Promise<void>;
    close: () => Promise<any>;
};
export default database;
