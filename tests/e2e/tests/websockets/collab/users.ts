import { randomUUID } from 'node:crypto';
import { createUser, type DirectusClient, type RestClient } from '@directus/sdk';

export type Rule = { collection: string; action: 'read' | 'update' | 'create' | 'delete'; fields: string[] };

/**
 * Creates a user whose only access is the rules given, and returns the token to reach the API with.
 */
export async function createRestrictedUser(
	api: DirectusClient<any> & RestClient<any>,
	permissions: Rule[],
): Promise<string> {
	const token = randomUUID();

	await api.request(
		createUser({
			first_name: 'Collab',
			last_name: 'Restricted',
			email: `${token}@collab.example.com`,
			password: 'secret',
			token,
			policies: [
				{
					policy: {
						name: `Collab ${token}`,
						admin_access: false,
						app_access: true,
						permissions: permissions.map((rule) => ({ ...rule, permissions: {}, validation: {}, presets: {} })),
					},
				},
			],
		} as any),
	);

	return token;
}
