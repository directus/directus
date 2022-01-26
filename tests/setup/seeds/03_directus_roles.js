exports.seed = async function (knex) {
	await knex('directus_roles').del();
	return await knex('directus_roles').insert([
		{ id: '5b935e65-d3db-4457-96f1-597e2fcfc7f3', name: 'TestAdmin', admin_access: true, app_access: true },
		{ id: '214faee7-d6a6-4a4c-b1cd-f9e9bd0b6fb7', name: 'TestUser', admin_access: false, app_access: false },
	]);
};
