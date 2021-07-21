/* eslint-disable no-console */

import { getSchema } from '../../../utils/get-schema';
import { UsersService } from '../../../services';
import getDatabase from '../../../database';

export default async function usersCreate({
	email,
	password,
	role,
}: {
	email?: string;
	password?: string;
	role?: string;
}): Promise<void> {
	const database = getDatabase();

	if (!email || !password || !role) {
		console.error('Email, password, role are required');
		process.exit(1);
	}

	try {
		const schema = await getSchema();
		const service = new UsersService({ schema, knex: database });

		const id = await service.createOne({ email, password, role, status: 'active' });
		console.log(id);
		database.destroy();
		process.exit(0);
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
}
