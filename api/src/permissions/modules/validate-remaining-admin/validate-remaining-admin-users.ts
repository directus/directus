import { validateRemainingAdminCount } from './validate-remaining-admin-count.js';
import { fetchUserCount, type FetchUserCountOptions } from '../../../utils/fetch-user-count/fetch-user-count.js';
import type { Context } from '../../types.js';

export type ValidateRemainingAdminUsersOptions = Pick<
	FetchUserCountOptions,
	'excludeAccessRows' | 'excludePolicies' | 'excludeUsers' | 'excludeRoles'
>;

export async function validateRemainingAdminUsers(options: ValidateRemainingAdminUsersOptions, context: Context) {
	const { admin } = await fetchUserCount({
		...options,
		adminOnly: true,
		knex: context.knex,
	});

	validateRemainingAdminCount(admin);
}
