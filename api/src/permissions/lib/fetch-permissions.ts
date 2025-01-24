import type { Accountability, PermissionsAction } from '@directus/types';
import type { Context } from '../types.js';
import { fetchDynamicVariableContext } from '../utils/fetch-dynamic-variable-context.js';
import { fetchRawPermissions } from '../utils/fetch-raw-permissions.js';
import { processPermissions } from '../utils/process-permissions.js';
import { getPermissionsForShare } from '../utils/get-permissions-for-share.js';
import emitter from '../../emitter.js';

export interface FetchPermissionsOptions {
	action?: PermissionsAction;
	policies: string[];
	collections?: string[];
	accountability?: Pick<Accountability, 'user' | 'role' | 'roles' | 'app' | 'share' | 'ip'>;
	bypassDynamicVariableProcessing?: boolean;
}

export async function fetchPermissions(options: FetchPermissionsOptions, context: Context) {
	const rawPermissions = await fetchRawPermissions(
		{ ...options, bypassMinimalAppPermissions: options.bypassDynamicVariableProcessing ?? false },
		context,
	);

	const permissions = await emitter.emitFilter('raw.permissions', rawPermissions, options, context as any);

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
		const processedPermissions = processPermissions({
			permissions,
			accountability: options.accountability,
			permissionsContext,
		});

		if (options.accountability.share && (options.action === undefined || options.action === 'read')) {
			return await getPermissionsForShare(options.accountability, options.collections, context);
		}

		return processedPermissions;
	}

	return permissions;
}
