import type { Accountability, Permission } from '@directus/types';
import type { Context } from '../types.js';
import { extractRequiredDynamicVariableContext } from './extract-required-dynamic-variable-context.js';
import { withCache } from './with-cache.js';

export const fetchDynamicVariableContext = withCache(
	'permission-dynamic-variables',
	_fetchDynamicVariableContext,
	({ policies, permissions, accountability: { user, role, roles } }) => ({
		policies,
		permissions,
		accountability: {
			user,
			role,
			roles,
		},
	}),
);

export interface FetchDynamicVariableContext {
	accountability: Pick<Accountability, 'user' | 'role' | 'roles'>;
	policies: string[];
	permissions: Permission[];
}

export async function _fetchDynamicVariableContext(options: FetchDynamicVariableContext, context: Context) {
	const { UsersService } = await import('../../services/users.js');
	const { RolesService } = await import('../../services/roles.js');
	const { PoliciesService } = await import('../../services/policies.js');

	const contextData: Record<string, any> = {};

	const permissionContext = extractRequiredDynamicVariableContext(options.permissions);

	if (options.accountability.user && (permissionContext.$CURRENT_USER?.size ?? 0) > 0) {
		const usersService = new UsersService(context);

		contextData['$CURRENT_USER'] = await usersService.readOne(options.accountability.user, {
			fields: Array.from(permissionContext.$CURRENT_USER!),
		});
	}

	if (options.accountability.role && (permissionContext.$CURRENT_ROLE?.size ?? 0) > 0) {
		const rolesService = new RolesService(context);

		contextData['$CURRENT_ROLE'] = await rolesService.readOne(options.accountability.role, {
			fields: Array.from(permissionContext.$CURRENT_ROLE!),
		});
	}

	if (options.accountability.roles.length > 0 && (permissionContext.$CURRENT_ROLES?.size ?? 0) > 0) {
		const rolesService = new RolesService(context);

		contextData['$CURRENT_ROLES'] = await rolesService.readMany(options.accountability.roles, {
			fields: Array.from(permissionContext.$CURRENT_ROLES!),
		});
	}

	if (options.policies.length > 0 && (permissionContext.$CURRENT_POLICIES?.size ?? 0) > 0) {
		const policiesService = new PoliciesService(context);

		contextData['$CURRENT_POLICIES'] = await policiesService.readMany(options.policies, {
			fields: Array.from(permissionContext.$CURRENT_POLICIES!),
		});
	}

	return contextData;
}
