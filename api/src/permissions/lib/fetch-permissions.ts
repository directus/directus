import type { Accountability, Filter, PermissionsAction } from '@directus/types';
import type { Context } from '../types.js';
import { fetchDynamicVariableContext } from '../utils/fetch-dynamic-variable-context.js';
import { fetchRawPermissions } from '../utils/fetch-raw-permissions.js';
import { processPermissions } from '../utils/process-permissions.js';
import { withAppMinimalPermissions } from './with-app-minimal-permissions.js';

export interface FetchPermissionsOptions {
	action?: PermissionsAction;
	policies: string[];
	collections?: string[];
	accountability?: Pick<Accountability, 'user' | 'role' | 'roles' | 'app'>;
	bypassDynamicVariableProcessing?: boolean;
}

export async function fetchPermissions(options: FetchPermissionsOptions, context: Context) {
	const permissions = await fetchRawPermissions(options, context);

	if (options.accountability && !options.bypassDynamicVariableProcessing) {
		const filter: Filter = {
			_and: [],
		};

		if (options.action) {
			filter._and.push({ action: { _eq: options.action } });
		}

		if (options.collections) {
			filter._and.push({ collection: { _in: options.collections } });
		}

		// Add app minimal permissions for the request accountability, if applicable.
		// Normally this is done in the permissions service readByQuery, but it also needs to do it here
		// since the permissions service is created without accountability.
		// We call it without the policies filter, since the static minimal app permissions don't have a policy attached.
		const permissionsWithAppPermissions = withAppMinimalPermissions(
			options.accountability ?? null,
			permissions,
			filter,
		);

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
