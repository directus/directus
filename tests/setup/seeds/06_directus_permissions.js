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
		{
			role: '67ce831d-7a02-4a06-a8c9-c8ea16d71e91',
			collection: 'artists',
			action: 'read',
			fields: 'id,name',
		},
		{
			role: '67ce831d-7a02-4a06-a8c9-c8ea16d71e91',
			collection: 'artists_events',
			action: 'read',
			fields: '*',
		},
		{
			role: '67ce831d-7a02-4a06-a8c9-c8ea16d71e91',
			collection: 'events',
			action: 'read',
			fields: '*',
		},
	]);
};
