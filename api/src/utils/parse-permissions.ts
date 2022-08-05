import { deepMap, parseJSON } from '@directus/shared/utils';
import { cloneDeep } from 'lodash';

export function parsePermissions(permissions: any[]) {
	const requiredPermissionData = {
		$CURRENT_USER: [] as string[],
		$CURRENT_ROLE: [] as string[],
		$CURRENT_ITEM: [] as string[],
	};

	let containDynamicData = false;

	permissions = permissions.map((permissionRaw) => {
		const permission = cloneDeep(permissionRaw);

		if (permission.permissions && typeof permission.permissions === 'string') {
			permission.permissions = parseJSON(permission.permissions);
		} else if (permission.permissions === null) {
			permission.permissions = {};
		}

		if (permission.validation && typeof permission.validation === 'string') {
			permission.validation = parseJSON(permission.validation);
		} else if (permission.validation === null) {
			permission.validation = {};
		}

		if (permission.presets && typeof permission.presets === 'string') {
			permission.presets = parseJSON(permission.presets);
		} else if (permission.presets === null) {
			permission.presets = {};
		}

		if (permission.fields && typeof permission.fields === 'string') {
			permission.fields = permission.fields.split(',');
		} else if (permission.fields === null) {
			permission.fields = [];
		}

		const extractPermissionData = (val: any) => {
			if (typeof val === 'string' && val.startsWith('$CURRENT_USER.')) {
				requiredPermissionData.$CURRENT_USER.push(val.replace('$CURRENT_USER.', ''));
				containDynamicData = true;
			}

			if (typeof val === 'string' && val.startsWith('$CURRENT_ROLE.')) {
				requiredPermissionData.$CURRENT_ROLE.push(val.replace('$CURRENT_ROLE.', ''));
				containDynamicData = true;
			}

			if (typeof val === 'string' && val.startsWith('$CURRENT_ITEM.')) {
				requiredPermissionData.$CURRENT_ITEM.push(val.replace('$CURRENT_ITEM.', ''));
				containDynamicData = true;
			}

			return val;
		};

		deepMap(permission.permissions, extractPermissionData);
		deepMap(permission.validation, extractPermissionData);
		deepMap(permission.presets, extractPermissionData);

		return permission;
	});

	return { permissions, requiredPermissionData, containDynamicData };
}
