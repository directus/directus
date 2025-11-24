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
	let generatedAccountability: Accountability | null;

	if (role === null) {
		generatedAccountability = createDefaultAccountability();
	} else if (role === 'system') {
		generatedAccountability = createDefaultAccountability({
			admin: true,
			app: true,
		});
	} else {
		const roles = await fetchRolesTree(role, { knex: context.database });

		// The roles tree should always include the passed role. If it doesn't, it's because it
		// couldn't be read from the database and therefore doesn't exist
		if (roles.length === 0) {
			throw new Error(`Configured role "${role}" isn't a valid role ID or doesn't exist.`);
		}

		const globalAccess = await fetchGlobalAccess(
			{ user: null, roles, ip: context.accountability?.ip ?? null },
			{ knex: context.database },
		);

		generatedAccountability = createDefaultAccountability({
			role,
			roles,
			user: null,
			...globalAccess,
		});
	}

	return generatedAccountability;
}
