import { Permission } from '../../../packages/shared/types';

export function isPermissionEmpty(perm: Permission) {
	return (
		(perm.fields || []).length === 0 &&
		Object.keys(perm.validation || {}).length === 0 &&
		Object.keys(perm.presets || {}).length === 0
	);
}
