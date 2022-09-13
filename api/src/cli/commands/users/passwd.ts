import { getSchema } from '../../../utils/get-schema';
import { generateHash } from '../../../utils/generate-hash';
import { UsersService } from '../../../services';
import getDatabase from '../../../database';
import logger from '../../../logger';

export default async function usersPasswd({ email, password }: { email?: string; password?: string }): Promise<void> {
	const database = getDatabase();

	if (!email || !password) {
		logger.error('Email and password are required');
		process.exit(1);
	}

	try {
		const passwordHashed = await generateHash(password);
		const schema = await getSchema();
		const service = new UsersService({ schema, knex: database });

		const user = await service.knex
			.select('id')
			.from('directus_users')
			.whereRaw('LOWER(??) = ?', ['email', email.toLowerCase()])
			.first();
		if (user) {
			await service.knex('directus_users').update({ password: passwordHashed }).where({ id: user.id });
			logger.info(`Password is updated for user ${user.id}`);
		} else {
			logger.error('No such user by this email');
		}

		await database.destroy();
		process.exit(user ? 0 : 1);
	} catch (err: any) {
		logger.error(err);
		process.exit(1);
	}
}
