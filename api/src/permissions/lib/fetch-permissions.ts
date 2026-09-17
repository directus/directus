import type { Accountability, PermissionsAction } from '@directus/types';
import { mergeFilters } from '@directus/utils';
import type { Context } from '../types.js';
import { extractRequiredDynamicVariableContextForPermissions } from '../utils/extract-required-dynamic-variable-context.js';
import { fetchDynamicVariableData } from '../utils/fetch-dynamic-variable-data.js';
import { fetchRawPermissions } from '../utils/fetch-raw-permissions.js';
import { getPermissionsForShare } from '../utils/get-permissions-for-share.js';
import { processPermissions } from '../utils/process-permissions.js';

export interface FetchPermissionsOptions {
	action?: PermissionsAction;
	policies: string[];
	collections?: string[];
	accountability?: Pick<Accountability, 'user' | 'role' | 'roles' | 'app' | 'share' | 'ip'> &
		Partial<Pick<Accountability, 'admin'>>;
	bypassDynamicVariableProcessing?: boolean;
}

export async function fetchPermissions(options: FetchPermissionsOptions, context: Context) {
	let permissions = await fetchRawPermissions(
		{ ...options, bypassMinimalAppPermissions: options.bypassDynamicVariableProcessing ?? false },
		context,
	);

	if (options.accountability && !options.bypassDynamicVariableProcessing) {
		const dynamicVariableContext = extractRequiredDynamicVariableContextForPermissions(permissions);

		const permissionsContext = await fetchDynamicVariableData(
			{
				accountability: options.accountability,
				policies: options.policies,
				dynamicVariableContext,
			},
			context,
		);

		// Replace dynamic variables with their actual values
		permissions = processPermissions({
			permissions,
			accountability: options.accountability,
			permissionsContext,
		});

		if (options.accountability.share && (options.action === undefined || options.action === 'read')) {
			permissions = await getPermissionsForShare(options.accountability, options.collections, context);
		}
	}

	if (options.accountability && !options.accountability.admin) {
		// Relational reads and MetaService counts query `directus_folders` without going through FoldersService
		permissions = permissions.map((permission) => {
			if (permission.collection !== 'directus_folders' || permission.action !== 'read') {
				return permission;
			}

			return { ...permission, permissions: mergeFilters(permission.permissions, { type: { _eq: 'files' } }) };
		});
	}

	return permissions;
}
