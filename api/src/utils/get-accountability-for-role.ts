import type { Accountability, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { fetchRolesTree } from '../permissions/lib/fetch-roles-tree.js';
import { fetchGlobalAccess } from '../permissions/modules/fetch-global-access/fetch-global-access.js';
import { createDefaultAccountability } from '../permissions/utils/create-default-accountability.js';

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
		generatedAccountability = createDefaultAccountability();
	} else if (role === 'system') {
		generatedAccountability = createDefaultAccountability({
			admin: true,
			app: true,
		});
	} else {
		const roles = await fetchRolesTree(role, context.database);
		const globalAccess = await fetchGlobalAccess(context.database, roles);

		generatedAccountability = createDefaultAccountability({
			role,
			roles,
			user: null,
			...globalAccess,
		});
	}

	return generatedAccountability;
}
