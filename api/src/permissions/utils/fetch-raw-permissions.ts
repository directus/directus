import type { Accountability, Filter, Permission, PermissionsAction } from '@directus/types';
import { sortBy } from 'lodash-es';
import { withAppMinimalPermissions } from '../lib/with-app-minimal-permissions.js';
import type { Context } from '../types.js';
import { withCache } from './with-cache.js';

export const fetchRawPermissions = withCache(
	'raw-permissions',
	_fetchRawPermissions,
	({ action, policies, collections, accountability, bypassMinimalAppPermissions }) => ({
		policies, // we assume that policies always come from the same source, so they should be in the same order
		...(action && { action }),
		...(collections && { collections: sortBy(collections) }),
		...(accountability && { accountability: { app: accountability.app } }),
		...(bypassMinimalAppPermissions && { bypassMinimalAppPermissions }),
	}),
);

export interface FetchRawPermissionsOptions {
	action?: PermissionsAction;
	policies: string[];
	collections?: string[];
	accountability?: Pick<Accountability, 'app'>;
	bypassMinimalAppPermissions?: boolean;
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

	if (options.accountability && !options.bypassMinimalAppPermissions) {
		// Add app minimal permissions for the request accountability, if applicable.
		// Normally this is done in the permissions service readByQuery, but it also needs to do it here
		// since the permissions service is created without accountability.
		// We call it without the policies filter, since the static minimal app permissions don't have a policy attached.
		return withAppMinimalPermissions(options.accountability ?? null, permissions, { _and: filter._and.slice(1) });
	}

	return permissions;
}
