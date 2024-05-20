import type { Filter, Permission, PermissionsAction } from '@directus/types';
import { PermissionsService } from '../../services/permissions.js';
import type { Context } from '../types.js';
import { withCache } from '../utils/with-cache.js';

export const fetchPermissions = withCache('permissions', _fetchPermissions);

export interface FetchPermissionsOptions {
	action: PermissionsAction;
	policies: string[];
	collections?: string[];
}

export async function _fetchPermissions(options: FetchPermissionsOptions, context: Context) {
	const permissionsService = new PermissionsService(context);

	const filter: Filter = {
		_and: [{ policy: { _in: options.policies } }, { action: { _eq: options.action } }],
	};

	if (options.collections) {
		filter._and.push({ collection: { _in: options.collections } });
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
