import { User } from '@directus/shared/types';
import getDatabase from '../database';

export async function notLastAdmin(user: Partial<User>): Promise<boolean> {
	const database = getDatabase();

	if (!user) {
		return false;
	}

	if (user.role?.name === 'admin') {
		const admins = await database.select('id').from('directus_users').where({ role: 'admin' });

		if (admins.length >= 1) {
			return true;
		}
	}

	return false;
}
