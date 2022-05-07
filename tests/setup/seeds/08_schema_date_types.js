exports.seed = async function (knex) {
	await knex('schema_date_types').del();
};
