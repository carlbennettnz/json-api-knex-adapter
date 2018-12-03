exports.up = async function(knex) {
  await knex.schema.createTable('invitation', table => {
    table.increments('seat_number').primary();
    table.specificType('author', 'object_id').references('author._id').onDelete('restrict deferrable initially deferred');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable('invitation');
};
