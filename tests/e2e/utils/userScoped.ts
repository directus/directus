import { createUser, DirectusClient, RestClient } from '@directus/sdk';
import { Permission, Snapshot } from '@directus/types';
import { Schema } from '../setup/schema';
import { randomUUID } from 'node:crypto';

/**
 * Generate a user with a policy attached to him giving him access to only the provided schema.
 */
export async function generateScopedUser(
	api: DirectusClient<Schema> & RestClient<Schema>,
	snapshot: Snapshot,
	actions: ('read' | 'create' | 'update' | 'delete')[] = ['read', 'create', 'update', 'delete'],
	mapPermission?: (perm: Permission) => Permission,
) {
	const token = randomUUID();

	const permissions: Permission[] = snapshot.collections.flatMap(({ collection }) => {
		return actions.map((action) => {
			const perm = {
				action,
				collection,
				fields: ['*'],
				permissions: {},
				validation: {},
				presets: {},
			} as Permission;

			return mapPermission ? mapPermission(perm) : perm;
		});
	});

	const user = await api.request(
		createUser({
			first_name: 'Test',
			last_name: 'User',
			email: `${randomUUID()}@test.com`,
			password: 'secret',
			token,
			policies: [
				{
					policy: {
						name: 'Scoped User Policy',
						admin_access: false,
						app_access: false,
						permissions,
					},
				},
			],
		}),
	);

	return { user, token };
}
