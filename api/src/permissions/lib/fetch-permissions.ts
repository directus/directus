import type { Accountability, PermissionsAction } from '@directus/types';
import type { Context } from '../types.js';
import { extractRequiredDynamicVariableContextForPermissions } from '../utils/extract-required-dynamic-variable-context.js';
import { fetchDynamicVariableData } from '../utils/fetch-dynamic-variable-data.js';
import { fetchRawPermissions } from '../utils/fetch-raw-permissions.js';
import { processPermissions } from '../utils/process-permissions.js';

export interface FetchPermissionsOptions {
	action?: PermissionsAction;
	policies: string[];
	collections?: string[];
	accountability?: Pick<Accountability, 'user' | 'role' | 'roles' | 'app' | 'ip'>;
	bypassDynamicVariableProcessing?: boolean;
}

export async function fetchPermissions(options: FetchPermissionsOptions, context: Context) {
	const permissions = await fetchRawPermissions(
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
		return processPermissions({
			permissions,
			accountability: options.accountability,
			permissionsContext,
		});
	}

	return permissions;
}
