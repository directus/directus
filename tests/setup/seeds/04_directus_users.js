const generateHash = require('../utils/setup-utils');

exports.seed = async function (knex) {
	await knex('directus_users').del();
	return await knex('directus_users').insert([
		{
			id: 'a8057636-9b70-4804-bfec-19c88d1a3273',
			email: 'test@admin.com',
			password: await generateHash.hash('TestAdminPassword'),
			status: 'active',
			role: '5b935e65-d3db-4457-96f1-597e2fcfc7f3',
			token: 'AdminToken',
		},
		{
			id: 'cb8cd13b-037f-40ca-862a-ea1e1f4bfca2',
			email: 'test@user.com',
			password: await generateHash.hash('TestUserPassword'),
			status: 'active',
			role: '214faee7-d6a6-4a4c-b1cd-f9e9bd0b6fb7',
			token: 'UserToken',
		},
		{
			id: '929a12a9-6717-499f-bb1f-d8742af8d8ca',
			email: 'test2@user.com',
			password: await generateHash.hash('TestUser2Password'),
			status: 'active',
			role: '67ce831d-7a02-4a06-a8c9-c8ea16d71e91',
			token: 'User2Token',
		},
		{
			id: 'cb8cd13b-037f-40ca-862a-ea1e1f4bfca3',
			email: 'test@noroleuser.com',
			password: await generateHash.hash('TestNoRoleUserPassword'),
			status: 'active',
			token: 'NoRoleUserToken',
		},
	]);
};
