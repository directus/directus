import { appAccessMinimalPermissions, appRecommendedPermissions } from '@directus/system-data';
import type { Permission } from '@directus/types';
import { isEqual } from 'lodash-es';
import { ItemsService } from '../../../services/index.js';
import { getSchema } from '../../../utils/get-schema.js';

export function hasCustomRule(permission: Partial<Permission>): boolean {
	if (permission.system === true) return false;

	return (
		permission.fields?.includes('*') !== true ||
		Object.keys(permission.permissions ?? {}).length > 0 ||
		Object.keys(permission.validation ?? {}).length > 0 ||
		Object.keys(permission.presets ?? {}).length > 0
	);
}

export function isRecommendedAppPermission(permission: Partial<Permission>): boolean {
	// recommended permissions never set validation or presets
	if (permission.validation || permission.presets) return false;

	const foundPermission = appRecommendedPermissions.find(
		(p) => p.action === permission.action && p.collection === permission.collection,
	);

	if (!foundPermission) return false;

	return (
		isEqual(foundPermission.fields ?? null, permission.fields ?? null) &&
		isEqual(foundPermission.permissions ?? null, permission.permissions ?? null)
	);
}

// because of legacy bug
export function isMinimumAppPermission(permission: Partial<Permission>): boolean {
	const foundPermission = appAccessMinimalPermissions.find(
		(p) => p.action === permission.action && p.collection === permission.collection,
	);

	if (!foundPermission) return false;

	return (
		isEqual(foundPermission.fields ?? null, permission.fields ?? null) &&
		isEqual(foundPermission.permissions ?? null, permission.permissions ?? null) &&
		isEqual(foundPermission.validation ?? null, permission.validation ?? null) &&
		isEqual(foundPermission.presets ?? null, permission.presets ?? null)
	);
}

export async function checkCustomPermissionRules() {
	const permissionService = new ItemsService('directus_permissions', {
		schema: await getSchema(),
	});

	const permissions = await permissionService.readByQuery({
		limit: -1,
		filter: {
			permissions: { _nnull: true },
			validation: { _nnull: true },
			presets: { _nnull: true },
			fields: { _nnull: true },
		},
	});

	const customRulePermissions = permissions.filter((p) => hasCustomRule(p) && !isRecommendedAppPermission(p));

	return customRulePermissions.length > 0;
}
