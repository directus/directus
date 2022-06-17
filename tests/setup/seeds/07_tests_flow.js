exports.seed = async function (knex) {
	await knex('tests_flow_data').del();
	await knex('tests_flow_completed').del();
};
