import type { Permission } from '@directus/types';
import { deepMap } from '@directus/utils';

export interface RequiredPermissionContext {
	$CURRENT_USER: Set<string>;
	$CURRENT_ROLE: Set<string>;
	$CURRENT_ROLES: Set<string>;
	$CURRENT_POLICIES: Set<string>;
}

export function extractRequiredDynamicVariableContext(permissions: Permission[]) {
	const permissionContext: RequiredPermissionContext = {
		$CURRENT_USER: new Set<string>(),
		$CURRENT_ROLE: new Set<string>(),
		$CURRENT_ROLES: new Set<string>(),
		$CURRENT_POLICIES: new Set<string>(),
	};

	for (const permission of permissions) {
		deepMap(permission.permissions, extractPermissionData);
		deepMap(permission.validation, extractPermissionData);
		deepMap(permission.presets, extractPermissionData);
	}

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
