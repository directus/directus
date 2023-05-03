import type { Permission } from '@directus/types';

export function isPermissionEmpty(perm: Permission): boolean {
	return (
		(perm.fields || []).length === 0 &&
		Object.keys(perm.validation || {}).length === 0 &&
		Object.keys(perm.presets || {}).length === 0 &&
		Object.keys(perm.permissions || {}).length === 0
	);
}
