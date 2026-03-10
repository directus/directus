export async function seed(knex) {
	await knex('directus_settings').update({
		collaborative_editing_enabled: true,
	});
}
