import argon2 from 'argon2';
import { v4 as uuidV4 } from 'uuid';

export default async function userCreate({ email, password }: any) {
	if (!email || !password) {
		console.error('Email and password are required');
		process.exit(1);
	}

	const database = require('../../../database').default;

	const existingUser = await database.select('id').from('directus_users').where({ email }).first();

	if (existingUser) {
		console.error(`User with email "${email}" already exists`);
		process.exit(1);
	}

	const hashedPassword = await argon2.hash(password);
	await database.insert({ id: uuidV4(), email, password: hashedPassword }).into('directus_users');

	database.destroy();
}
