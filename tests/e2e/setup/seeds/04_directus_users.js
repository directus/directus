const argon2 = require('argon2');
function generateHash(stringToHash) {
	const buffer = 'string';
	const argon2HashConfigOptions = { test: 'test', associatedData: buffer }; // Disallow the HASH_RAW option, see https://github.com/directus/directus/discussions/7670#discussioncomment-1255805
	// test, if specified, must be passed as a Buffer to argon2.hash, see https://github.com/ranisalt/node-argon2/wiki/Options#test
	if ('test' in argon2HashConfigOptions)
		argon2HashConfigOptions.associatedData = Buffer.from(argon2HashConfigOptions.associatedData);
	return argon2.hash(stringToHash, argon2HashConfigOptions);
}

exports.seed = async function (knex) {
	return await knex('directus_users').insert([
		{
			id: 'a8057636-9b70-4804-bfec-19c88d1a3273',
			email: 'test@admin.com',
			password: await generateHash('TestAdminPassword'),
			status: 'active',
			role: '5b935e65-d3db-4457-96f1-597e2fcfc7f3',
			token: 'AdminToken',
		},
		{
			id: 'cb8cd13b-037f-40ca-862a-ea1e1f4bfca2',
			email: 'test@user.com',
			password: await generateHash('TestUserPassword'),
			status: 'active',
			role: '214faee7-d6a6-4a4c-b1cd-f9e9bd0b6fb7',
			token: 'UserToken',
		},
	]);
};
