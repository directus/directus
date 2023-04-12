exports.seed = async function (knex) {
	await knex('tests_extensions_log').del();
};
