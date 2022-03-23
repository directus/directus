exports.up = async function (knex) {
	await knex.schema.createTable('schema_date_types', (table) => {
		table.integer('id').primary().notNullable();
		table.date('date');
		table.time('time');
		table.datetime('datetime', { useTz: false });
		table.timestamp('timestamp', { useTz: true }).nullable();
		table.timestamp('date_created', { useTz: true }).nullable();
		table.timestamp('date_updated', { useTz: true }).nullable();
	});
};

exports.down = async function (knex) {
	await knex.schema.dropTable('schema_date_types');
};
