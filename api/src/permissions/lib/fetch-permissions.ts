import type { Accountability, Filter, Permission, PermissionsAction } from '@directus/types';
import { pick, sortBy } from 'lodash-es';
import type { Context } from '../types.js';
import { fetchDynamicVariableContext } from '../utils/fetch-dynamic-variable-context.js';
import { processPermissions } from '../utils/process-permissions.js';
import { withCache } from '../utils/with-cache.js';
import { withAppMinimalPermissions } from './with-app-minimal-permissions.js';

export const fetchPermissions = withCache(
	'permissions',
	_fetchPermissions,
	({ action, policies, collections, accountability }) => ({
		policies, // we assume that policies always come from the same source, so they should be in the same order
		...(action && { action }),
		...(collections && { collections: sortBy(collections) }),
		...(accountability && { accountability: pick(accountability, ['user', 'role', 'roles', 'app']) }),
	}),
);

export interface FetchPermissionsOptions {
	action?: PermissionsAction;
	policies: string[];
	collections?: string[];
	accountability?: Pick<Accountability, 'user' | 'role' | 'roles' | 'app'>;
}

export async function _fetchPermissions(options: FetchPermissionsOptions, context: Context) {
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

	if (options.accountability) {
		// Add app minimal permissions for the request accountability, if applicable.
		// Normally this is done in the permissions service readByQuery, but it also needs to do it here
		// since the permissions service is created without accountability.
		// We call it without the policies filter, since the static minimal app permissions don't have a policy attached.
		const permissionsWithAppPermissions = withAppMinimalPermissions(options.accountability ?? null, permissions, {
			_and: filter._and.slice(1),
		});

		const permissionsContext = await fetchDynamicVariableContext(
			{
				accountability: options.accountability,
				policies: options.policies,
				permissions: permissionsWithAppPermissions,
			},
			context,
		);

		// Replace dynamic variables with their actual values
		const processedPermissions = processPermissions({
			permissions: permissionsWithAppPermissions,
			accountability: options.accountability,
			permissionsContext,
		});

		// TODO merge in permissions coming from the share scope

		return processedPermissions;
	}

	return permissions;
}
