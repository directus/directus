import { DEFAULT_AUTH_PROVIDER } from '../../../constants.js';
import { UsersService } from '../../../services/index.js';
import { getSchema } from '../../../utils/get-schema.js';

/**
 * Counting the current amount of users with sso enabled
 */
export async function checkUsersSSO() {
	const usersService = new UsersService({
		schema: await getSchema(),
	});

	const sso_users = await usersService.readByQuery({
		fields: ['id'],
		filter: {
			provider: { _neq: DEFAULT_AUTH_PROVIDER },
			status: { _eq: 'active' },
		},
	});

	return sso_users.length > 0;
}
