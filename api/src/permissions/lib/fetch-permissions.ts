import type { Permission, PermissionsAction } from '@directus/types';
import type { PermissionsService } from '../../services/permissions/index.js';

export async function fetchPermissions(
	permissionsService: PermissionsService,
	action: PermissionsAction,
	policies: string[],
	collections: string[],
) {
	const permissions = (await permissionsService.readByQuery({
		filter: {
			_and: [{ policy: { _in: policies } }, { collection: { _in: collections } }, { action: { _eq: action } }],
		},
		limit: -1,
	})) as Permission[];

	return permissions;
}
