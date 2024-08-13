import type { Accountability, Filter, Permission, PermissionsAction } from '@directus/types';
import { pick, sortBy } from 'lodash-es';
import type { Context } from '../types.js';
import { withCache } from './with-cache.js';

export const fetchRawPermissions = withCache(
	'raw-permissions',
	_fetchRawPermissions,
	({ action, policies, collections, accountability }) => ({
		policies, // we assume that policies always come from the same source, so they should be in the same order
		...(action && { action }),
		...(collections && { collections: sortBy(collections) }),
		...(accountability && { accountability: pick(accountability, ['user', 'role', 'roles', 'app']) }),
	}),
);

export interface FetchRawPermissionsOptions {
	action?: PermissionsAction;
	policies: string[];
	collections?: string[];
	accountability?: Pick<Accountability, 'user' | 'role' | 'roles' | 'app'>;
}

export async function _fetchRawPermissions(options: FetchRawPermissionsOptions, context: Context) {
	const { PermissionsService } = await import('../../services/permissions.js');
	const permissionsService = new PermissionsService(context);

	const filter: Filter = {
		_and: [{ policy: { _in: options.policies } }],
	};

	if (options.action) {
		filter._and.push({ action: { _eq: options.action } });
	}

	if (options.collections) {
		filter._and.push({ collection: { _in: options.collections } });
	}

	let permissions = (await permissionsService.readByQuery({
		filter,
		limit: -1,
	})) as Permission[];

	// Sort permissions by their order in the policies array
	// This ensures that if a sorted array of policies is passed in the permissions are returned in the same order
	// which is necessary for correctly applying the presets in order
	permissions = sortBy(permissions, (permission) => options.policies.indexOf(permission.policy!));

	return permissions;
}
