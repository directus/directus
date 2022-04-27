exports.seed = async function (knex) {
	await knex('directus_permissions').del();

	return await knex('directus_permissions').insert([
		// TestUser role permissions
		{
			role: '214faee7-d6a6-4a4c-b1cd-f9e9bd0b6fb7',
			collection: 'guests',
			action: 'read',
			fields: '*',
		},
		{
			role: '214faee7-d6a6-4a4c-b1cd-f9e9bd0b6fb7',
			collection: 'directus_roles',
			action: 'read',
			fields: '*',
		},
	]);
};
