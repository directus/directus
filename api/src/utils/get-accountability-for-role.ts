import type { Accountability, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { fetchRolesTree } from '../permissions/lib/fetch-roles-tree.js';

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
		const roleInfo = await context.database
			.select(['app_access', 'admin_access'])
			.from('directus_roles')
			.where({ id: role })
			.first();

		if (!roleInfo) {
			throw new Error(`Configured role "${role}" isn't a valid role ID or doesn't exist.`);
		}

		generatedAccountability = {
			role,
			roles: await fetchRolesTree(context.database, role),
			user: null,
			// TODO get global access 👇🏻
			admin: roleInfo.admin_access === 1 || roleInfo.admin_access === '1' || roleInfo.admin_access === true,
			app: roleInfo.app_access === 1 || roleInfo.app_access === '1' || roleInfo.app_access === true,
		};
	}

	return generatedAccountability;
}
