exports.seed = async function (knex) {
	return await knex('directus_users').insert([
		{
			id: 'a8057636-9b70-4804-bfec-19c88d1a3273',
			email: 'test@admin.com',
			password: 'TestAdminPassword',
			status: 'active',
			role: '5b935e65-d3db-4457-96f1-597e2fcfc7f3',
			token: 'AdminToken',
		},
	]);
};
