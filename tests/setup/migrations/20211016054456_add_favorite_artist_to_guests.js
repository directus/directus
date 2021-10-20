exports.up = function (knex) {
	knex.schema.alterTable('guests', (table) => {
		table.integer('favorite_artist').unsigned().references('id').inTable('artists');
	});
};

exports.down = function (knex) {
	knex.schema.alterTable('guests', (table) => {
		table.dropColumn('favorite_artist');
	});
};
