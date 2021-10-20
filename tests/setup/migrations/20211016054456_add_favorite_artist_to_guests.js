exports.up = async function (knex) {
	await knex.schema.alterTable('guests', (table) => {
		table.integer('favorite_artist').unsigned().references('id').inTable('artists');
	});
};

exports.down = async function (knex) {
	await knex.schema.alterTable('guests', (table) => {
		table.dropColumn('favorite_artist');
	});
};
