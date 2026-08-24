import { USER_INACTIVE_LICENSE_STATUS } from '@directus/constants';
import type { ResolveInput } from '@directus/license';
import type { Accountability } from '@directus/types';
import { isObject } from '@directus/utils';
import type { Knex } from 'knex';
import { DEFAULT_AUTH_PROVIDER } from '../../../constants.js';
import getDatabase from '../../../database/index.js';
import { UsersService } from '../../../services/index.js';
import { getSchema } from '../../../utils/get-schema.js';

/**
 * Counting the current amount of users with sso enabled
 */
export async function checkUsersSSO(opts?: { knex?: Knex | undefined }) {
	const knex = opts?.knex ?? getDatabase();
	const schema = await getSchema({ database: knex });

	const usersService = new UsersService({
		schema,
		knex,
	});

	const sso_users = await usersService.readByQuery({
		fields: ['id'],
		filter: {
			provider: { _neq: DEFAULT_AUTH_PROVIDER },
			status: { _eq: 'active' },
		},
	});

	return sso_users.length === 0;
}

export async function resolveSSOUsers(
	resolution: NonNullable<ResolveInput['sso_enabled']>,
	ctx?: { accountability?: Accountability | undefined },
) {
	if (!ctx?.accountability?.user) return;

	const adminId = ctx.accountability.user;
	const usersService = new UsersService({ schema: await getSchema(), accountability: ctx?.accountability });

	await usersService.updateByQuery(
		{
			filter: {
				_and: [{ provider: { _neq: DEFAULT_AUTH_PROVIDER, _nnull: true } }, { id: { _neq: adminId } }],
			},
		},
		{ status: USER_INACTIVE_LICENSE_STATUS },
	);

	if (isObject(resolution) && Object.keys(resolution.admin ?? {}).length) {
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
