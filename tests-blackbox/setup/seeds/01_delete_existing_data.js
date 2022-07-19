exports.seed = async function (knex) {
	if (process.env.TEST_LOCAL) {
		await knex('directus_collections').del();
		await knex('directus_relations').del();
		await knex('directus_roles').del();
		await knex('directus_users').del();
	}
};
