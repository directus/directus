export async function seed(knex) {
	await knex('directus_settings').update({
		mcp_enabled: true,
	});
}
