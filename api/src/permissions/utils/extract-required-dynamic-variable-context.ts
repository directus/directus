import type { Permission } from '@directus/types';
import { deepMap } from '@directus/utils';

export interface DynamicVariableContext {
	$CURRENT_USER: Set<string>;
	$CURRENT_ROLE: Set<string>;
	$CURRENT_ROLES: Set<string>;
	$CURRENT_POLICIES: Set<string>;
}

export function extractRequiredDynamicVariableContextForPermissions(permissions: Permission[]) {
	let permissionContext: DynamicVariableContext = {
		$CURRENT_USER: new Set<string>(),
		$CURRENT_ROLE: new Set<string>(),
		$CURRENT_ROLES: new Set<string>(),
		$CURRENT_POLICIES: new Set<string>(),
	};

	for (const permission of permissions) {
		permissionContext = mergeContexts(permissionContext, extractRequiredDynamicVariableContext(permission.permissions));

		permissionContext = mergeContexts(permissionContext, extractRequiredDynamicVariableContext(permission.validation));
		permissionContext = mergeContexts(permissionContext, extractRequiredDynamicVariableContext(permission.presets));
	}

	return permissionContext;
}

export function extractRequiredDynamicVariableContext(val: any) {
	const permissionContext: DynamicVariableContext = {
		$CURRENT_USER: new Set<string>(),
		$CURRENT_ROLE: new Set<string>(),
		$CURRENT_ROLES: new Set<string>(),
		$CURRENT_POLICIES: new Set<string>(),
	};

	deepMap(val, extractPermissionData);

	return permissionContext;

	function extractPermissionData(val: any) {
		for (const placeholder of [
			'$CURRENT_USER',
			'$CURRENT_ROLE',
			'$CURRENT_ROLES',
			'$CURRENT_POLICIES',
		] as (keyof typeof permissionContext)[]) {
			if (typeof val === 'string' && val.startsWith(`${placeholder}.`)) {
				permissionContext[placeholder].add(val.replace(`${placeholder}.`, ''));
			}
		}
	}
}

function mergeContexts(context1: DynamicVariableContext, context2: DynamicVariableContext) {
	const permissionContext: DynamicVariableContext = {
		$CURRENT_USER: new Set([...context1.$CURRENT_USER, ...context2.$CURRENT_USER]),
		$CURRENT_ROLE: new Set([...context1.$CURRENT_ROLE, ...context2.$CURRENT_ROLE]),
		$CURRENT_ROLES: new Set([...context1.$CURRENT_ROLES, ...context2.$CURRENT_ROLES]),
		$CURRENT_POLICIES: new Set([...context1.$CURRENT_POLICIES, ...context2.$CURRENT_POLICIES]),
	};

	return permissionContext;
}
