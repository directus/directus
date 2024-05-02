import type { Accountability, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { fetchRolesTree } from '../permissions/lib/fetch-roles-tree.js';
import { fetchGlobalAccess } from '../permissions/modules/fetch-global-access/fetch-global-access.js';

export async function getAccountabilityForRole(
	role: null | string,
	context: {
		accountability: null | Accountability;
		schema: SchemaOverview;
		database: Knex;
	},
): Promise<Accountability> {
	let generatedAccountability: Accountability | null = context.accountability;

	if (role === null) {
		generatedAccountability = {
			role: null,
			roles: [],
			user: null,
			admin: false,
			app: false,
		};
	} else if (role === 'system') {
		generatedAccountability = {
			user: null,
			role: null,
			roles: [],
			admin: true,
			app: true,
		};
	} else {
		const roles = await fetchRolesTree(context.database, role);
		const globalAccess = await fetchGlobalAccess(context.database, roles);

		generatedAccountability = {
			role,
			roles,
			user: null,
			...globalAccess,
		};
	}

	return generatedAccountability;
}
