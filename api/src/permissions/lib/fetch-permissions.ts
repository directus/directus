import type { Accountability, Filter, Permission, PermissionsAction } from '@directus/types';
import { sortBy } from 'lodash-es';
import { withAppMinimalPermissions } from '../../services/permissions/lib/with-app-minimal-permissions.js';
import type { Context } from '../types.js';
import { fetchDynamicVariableContext } from '../utils/fetch-dynamic-variable-context.js';
import { processPermissions } from '../utils/process-permissions.js';
import { withCache } from '../utils/with-cache.js';

export const fetchPermissions = withCache(
	'permissions',
	_fetchPermissions,
	({ action, policies, collections, accountability: { user, role, roles, app } }) => ({
		action,
		policies, // we assume that policies always come from the same source, so they should be in the same order
		collections: sortBy(collections),
		accountability: {
			user,
			role,
			roles,
			app,
		},
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

	const permissions = (await permissionsService.readByQuery({
		filter,
		limit: -1,
	})) as Permission[];

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
