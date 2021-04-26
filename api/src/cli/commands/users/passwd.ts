import argon2 from 'argon2';
import { getSchema } from '../../../utils/get-schema';

export default async function usersPasswd(user: { email: string; password: string }): Promise<void> {
	const { default: database } = require('../../../database/index');
	const { UsersService } = require('../../../services/users');

	if (!user.email || !user.password) {
		console.error('Email and password are required');
		process.exit(1);
	}

	try {
		const passwordHashed = await argon2.hash(user.password);
		const schema = await getSchema();
		const service = new UsersService({ schema, knex: database });

		const dbUser = await service.knex.select('id').from('directus_users').where({ email: user.email }).first();
		if (dbUser) {
			await service.knex('directus_users').update({ password: passwordHashed }).where({ id: dbUser.id });
			console.log(`Password is updated for user ${dbUser.id}`);
		} else {
			console.log('No such user by this email');
		}

		await database.destroy();
		process.exit(user ? 0 : 1);
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
}
