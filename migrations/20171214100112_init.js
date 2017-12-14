exports.up = async function(knex) {
  await knex.raw(`
    CREATE DOMAIN object_id AS char(24) CHECK (VALUE ~ '^[0-9a-f]{24}$');
  `);

  await knex.raw(`
    CREATE OR REPLACE FUNCTION generate_object_id() RETURNS object_id AS $$
        DECLARE
            time_component bigint;
            machine_id bigint := FLOOR(random() * 16777215);
            process_id bigint;
            seq_id bigint := FLOOR(random() * 16777215);
            result varchar(24):= '';
        BEGIN
            SELECT FLOOR(EXTRACT(EPOCH FROM clock_timestamp())) INTO time_component;
            SELECT pg_backend_pid() INTO process_id;

            result := result || lpad(to_hex(time_component), 8, '0');
            result := result || lpad(to_hex(machine_id), 6, '0');
            result := result || lpad(to_hex(process_id), 4, '0');
            result := result || lpad(to_hex(seq_id), 6, '0');
            RETURN result::object_id;
        END;
    $$ LANGUAGE PLPGSQL;
  `);

  await knex.schema.createTable('author', table => {
    table.specificType('_id', 'object_id').default(knex.raw(`generate_object_id()`)).primary();
    table.text('name');
  });

  await knex.schema.createTable('tag', table => {
    table.specificType('_id', 'object_id').default(knex.raw(`generate_object_id()`)).primary();
    table.text('name');
  });

  await knex.schema.createTable('post', table => {
    table.specificType('_id', 'object_id').default(knex.raw(`generate_object_id()`)).primary();
    table.text('title');
    table.timestamp('date');
    table.specificType('author', 'object_id').references('author._id').onDelete('cascade deferrable initially deferred');
  });

  await knex.schema.createTable('award', table => {
    table.specificType('_id', 'object_id').default(knex.raw(`generate_object_id()`)).primary();
    table.text('name');
    table.specificType('winner', 'object_id').references('author._id').onDelete('cascade deferrable initially deferred');
    table.specificType('runnerUp', 'object_id').references('author._id').onDelete('cascade deferrable initially deferred');
  });

  await knex.schema.createTable('comment', table => {
    table.specificType('_id', 'object_id').default(knex.raw(`generate_object_id()`)).primary();
    table.text('content');
    table.specificType('post', 'object_id').references('post._id').onDelete('cascade deferrable initially deferred');
  });

  await knex.schema.createTable('award_winner_tag', table => {
    table.specificType('award', 'object_id').references('award._id').onDelete('cascade deferrable initially deferred');
    table.specificType('tag', 'object_id').references('tag._id').onDelete('cascade deferrable initially deferred');
    table.primary([ 'award', 'tag' ]);
  });

  await knex.schema.createTable('award_runner_up_tag', table => {
    const r = table.specificType('award', 'object_id').references('award._id').onDelete('cascade deferrable initially deferred');
    table.specificType('tag', 'object_id').references('tag._id').onDelete('cascade deferrable initially deferred');
    table.primary([ 'award', 'tag' ]);
  });

  await knex.schema.createTable('post_tag', table => {
    table.specificType('post', 'object_id').references('post._id').onDelete('cascade deferrable initially deferred');
    table.specificType('tag', 'object_id').references('tag._id').onDelete('cascade deferrable initially deferred');
    table.primary([ 'post', 'tag' ]);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable('post_tag');
  await knex.schema.dropTable('award_winner_tag');
  await knex.schema.dropTable('award_runner_up_tag');
  await knex.schema.dropTable('comment');
  await knex.schema.dropTable('award');
  await knex.schema.dropTable('post');
  await knex.schema.dropTable('tag');
  await knex.schema.dropTable('author');
  await knex.schema.raw('DROP FUNCTION generate_object_id()');
  await knex.schema.raw('DROP DOMAIN object_id');
};
