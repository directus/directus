/* eslint-disable no-console */

import argon2 from 'argon2';
import { getSchema } from '../../../utils/get-schema';
import { UsersService } from '../../../services';
import getDatabase from '../../../database';

export default async function usersPasswd({ email, password }: { email?: string; password?: string }): Promise<void> {
	const database = getDatabase();

	if (!email || !password) {
		console.error('Email and password are required');
		process.exit(1);
	}

	try {
		const passwordHashed = await argon2.hash(password);
		const schema = await getSchema();
		const service = new UsersService({ schema, knex: database });

		const user = await service.knex.select('id').from('directus_users').where({ email }).first();
		if (user) {
			await service.knex('directus_users').update({ password: passwordHashed }).where({ id: user.id });
			console.log(`Password is updated for user ${user.id}`);
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
