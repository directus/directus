import type { ResolveInput } from '@directus/license';
import type { Knex } from 'knex';
import { DEFAULT_AUTH_PROVIDER } from '../../../constants.js';
import { UsersService } from '../../../services/index.js';
import { getSchema } from '../../../utils/get-schema.js';

/**
 * Counting the current amount of users with sso enabled
 */
export async function checkUsersSSO(opts?: { knex?: Knex | undefined }) {
	const usersService = new UsersService({
		schema: await getSchema(),
		knex: opts?.knex,
	});

	const sso_users = await usersService.readByQuery({
		fields: ['id'],
		filter: {
			provider: { _neq: DEFAULT_AUTH_PROVIDER },
			status: { _eq: 'active' },
		},
	});

	return sso_users.length == 0;
}

export async function resolveSSOUsers(resolution: NonNullable<ResolveInput['sso_enabled']>, ctx?: { adminId: string }) {
	if (!ctx?.adminId) return;

	const { adminId } = ctx;
	const usersService = new UsersService({ schema: await getSchema() });

	await usersService.updateByQuery(
		{
			filter: {
				_and: [{ provider: { _neq: DEFAULT_AUTH_PROVIDER, _nnull: true } }, { id: { _neq: adminId } }],
			},
		},
		{ status: 'deactivated-license-exceeded' },
	);

	if (typeof resolution === 'object' && Object.keys(resolution.admin).length) {
		const payload: { email?: string | undefined; password?: string; provider: string } = {
			provider: DEFAULT_AUTH_PROVIDER,
		};

		if (resolution.admin.email?.length) {
			payload['email'] = resolution.admin.email;
		}

		if (resolution.admin.password?.length) {
			payload['password'] = resolution.admin.password;
		}

		await usersService.updateOne(adminId, payload);
	}
}
