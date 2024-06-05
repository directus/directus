import type { Accountability, Permission } from '@directus/types';
import { parseFilter, parsePreset } from '@directus/utils';
import { cloneDeep } from 'lodash-es';

export interface ProcessPermissionsOptions {
	permissions: Permission[];
	accountability: Pick<Accountability, 'user' | 'role' | 'roles'>;
	permissionsContext: Record<string, any>;
}

export function processPermissions({ permissions, accountability, permissionsContext }: ProcessPermissionsOptions) {
	return permissions.map((permissionRaw) => {
		const permission = cloneDeep(permissionRaw);

		permission.permissions = parseFilter(permission.permissions, accountability, permissionsContext);
		permission.validation = parseFilter(permission.validation, accountability, permissionsContext);
		permission.presets = parsePreset(permission.presets, accountability, permissionsContext);

		return permission;
	});
}
