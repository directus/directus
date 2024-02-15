import type { User, UserOnboarding } from '@directus/types';
import getDatabase from '../../database/index.js';
import { UsersService } from '../../services/users.js';
import { getSchema } from '../../utils/get-schema.js';

/**
 * Get a list of IDs of users which havent sent over the onboarding info yet
 */
export const getUnsentOnboardingUsers = async (): Promise<Array<User['id']>> => {
	const db = getDatabase();
	const schema = await getSchema({ database: db });
	const usersService = new UsersService({ schema });

	const userItems = await usersService.readByQuery({
		fields: ['id', 'onboarding'],
		filter: { onboarding: { _nnull: true } },
	});

	const unsentUserItems = userItems.filter((item) => (item?.['onboarding'] as UserOnboarding).retry_transmission);

	return unsentUserItems.map((item) => item['id']);
};
