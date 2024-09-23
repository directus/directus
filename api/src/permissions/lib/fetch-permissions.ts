import type { Accountability, PermissionsAction } from '@directus/types';
import type { Context } from '../types.js';
import { fetchDynamicVariableContext } from '../utils/fetch-dynamic-variable-context.js';
import { fetchRawPermissions } from '../utils/fetch-raw-permissions.js';
import { processPermissions } from '../utils/process-permissions.js';
import { mergePermissionsForShare } from '../utils/merge-permissions-for-share.js';

export interface FetchPermissionsOptions {
	action?: PermissionsAction;
	policies: string[];
	collections?: string[];
	accountability?: Pick<Accountability, 'user' | 'role' | 'roles' | 'app' | 'share'>;
	bypassDynamicVariableProcessing?: boolean;
}

export async function fetchPermissions(options: FetchPermissionsOptions, context: Context) {
	const permissions = await fetchRawPermissions(
		{ ...options, bypassMinimalAppPermissions: options.bypassDynamicVariableProcessing ?? false },
		context,
	);

	if (options.accountability && !options.bypassDynamicVariableProcessing) {
		const permissionsContext = await fetchDynamicVariableContext(
			{
				accountability: options.accountability,
				policies: options.policies,
				permissions,
			},
			context,
		);

		// Replace dynamic variables with their actual values
		let processedPermissions = processPermissions({
			permissions,
			accountability: options.accountability,
			permissionsContext,
		});

		// TODO merge in permissions coming from the share scope

		if (options.accountability.share) {
			processedPermissions = await mergePermissionsForShare(processedPermissions, options.accountability as any, context);

			console.log('mergePermissionsForShare', JSON.stringify(processedPermissions, null, 4));
		}

		return processedPermissions;
	}

	return permissions;
}
