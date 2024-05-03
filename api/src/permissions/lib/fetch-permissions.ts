import type { Filter, Permission, PermissionsAction } from '@directus/types';
import type { PermissionsService } from '../../services/permissions/index.js';

export async function fetchPermissions(
	permissionsService: PermissionsService,
	action: PermissionsAction,
	policies: string[],
	collections?: string[],
) {
	const filter: Filter = {
		_and: [{ policy: { _in: policies } }, { action: { _eq: action } }],
	};

	if (collections) {
		filter._and.push({ collection: { _in: collections } });
	}

	const permissions = (await permissionsService.readByQuery({
		filter,
		limit: -1,
	})) as Permission[];

	// TODO add in permissions processing to allow for dynamic fields (like $CURRENT_USER)
	// See https://github.com/directus/directus/blob/main/api/src/utils/get-permissions.ts for current impl

	// TODO merge in permissions coming from the share scope

	return permissions;
}
