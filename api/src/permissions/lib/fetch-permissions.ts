import type { PermissionsAction } from '@directus/system-data';
import type { Permission, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { PermissionsService } from '../../services/permissions/index.js';

export async function fetchPermissions(
	knex: Knex,
	schema: SchemaOverview,
	action: PermissionsAction,
	policies: string[],
	collections: string[],
) {
	const permissionsService = new PermissionsService({ schema, knex });

	const permissions = (await permissionsService.readByQuery({
		filter: {
			_and: [
				{ policy: { _in: policies } },
				{ collection: { _in: Array.from(collections) } },
				{ action: { _eq: action } },
			],
		},
		limit: -1,
	})) as Permission[];

	return permissions;
}
