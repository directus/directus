export async function seed(knex) {
	if (process.env.TEST_LOCAL) {
		await knex('directus_collections').del();
		await knex('directus_relations').del();
		await knex('directus_roles').del();
		await knex('directus_permissions').del();
		await knex('directus_policies').del();
		await knex('directus_access').del();
		await knex('directus_revisions').del();
		await knex('directus_versions').del();
		await knex('directus_users').del();
	}
}
