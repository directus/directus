import { Permission, Accountability } from '@directus/shared/types';
import { deepMap, parseFilter } from '@directus/shared/utils';
import { cloneDeep } from 'lodash';
import getDatabase from '../database';
import { appAccessMinimalPermissions } from '../database/system-data/app-access-permissions';
import { mergePermissions } from '../utils/merge-permissions';
import { UsersService } from '../services/users';
import { RolesService } from '../services/roles';
import { getCache } from '../cache';
import hash from 'object-hash';
import env from '../env';
import { SchemaOverview } from '../types';

export async function getPermissions(accountability: Accountability, schema: SchemaOverview) {
	const database = getDatabase();
	const { systemCache, cache } = getCache();

	let permissions: Permission[] = [];

	const { user, role, app, admin } = accountability;
	const cacheKey = `permissions-${hash({ user, role, app, admin })}`;

	if (env.CACHE_PERMISSIONS !== false) {
		const cachedPermissions = await systemCache.get(cacheKey);

		if (cachedPermissions) {
			if (!cachedPermissions.containDynamicData) {
				return processPermissions(accountability, cachedPermissions.permissions, {});
			}

			const cachedFilterContext = await cache?.get(
				`filterContext-${hash({ user, role, permissions: cachedPermissions.permissions })}`
			);

			if (cachedFilterContext) {
				return processPermissions(accountability, cachedPermissions.permissions, cachedFilterContext);
			} else {
				let requiredPermissionData, containDynamicData;

				({ permissions, requiredPermissionData, containDynamicData } = parsePermissions(cachedPermissions.permissions));

				const filterContext = containDynamicData
					? await getFilterContext(schema, accountability, requiredPermissionData)
					: {};

				if (containDynamicData && env.CACHE_ENABLED !== false) {
					await cache?.set(`filterContext-${hash({ user, role, permissions })}`, filterContext);
				}

				return processPermissions(accountability, permissions, filterContext);
			}
		}
	}

	if (accountability.admin !== true) {
		const permissionsForRole = await database
			.select('*')
			.from('directus_permissions')
			.where({ role: accountability.role });

		let requiredPermissionData, containDynamicData;

		({ permissions, requiredPermissionData, containDynamicData } = parsePermissions(permissionsForRole));

		if (accountability.app === true) {
			permissions = mergePermissions(
				permissions,
				appAccessMinimalPermissions.map((perm) => ({ ...perm, role: accountability!.role }))
			);
		}

		const filterContext = containDynamicData
			? await getFilterContext(schema, accountability, requiredPermissionData)
			: {};

		if (env.CACHE_PERMISSIONS !== false) {
			await systemCache.set(cacheKey, { permissions, containDynamicData });

			if (containDynamicData && env.CACHE_ENABLED !== false) {
				await cache?.set(`filterContext-${hash({ user, role, permissions })}`, filterContext);
			}
		}

		return processPermissions(accountability, permissions, filterContext);
	}

	return permissions;
}

function parsePermissions(permissions: any[]) {
	const requiredPermissionData = {
		$CURRENT_USER: [] as string[],
		$CURRENT_ROLE: [] as string[],
	};

	let containDynamicData = false;

	permissions = permissions.map((permissionRaw) => {
		const permission = cloneDeep(permissionRaw);

		if (permission.permissions && typeof permission.permissions === 'string') {
			permission.permissions = JSON.parse(permission.permissions);
		} else if (permission.permissions === null) {
			permission.permissions = {};
		}

		if (permission.validation && typeof permission.validation === 'string') {
			permission.validation = JSON.parse(permission.validation);
		} else if (permission.validation === null) {
			permission.validation = {};
		}

		if (permission.presets && typeof permission.presets === 'string') {
			permission.presets = JSON.parse(permission.presets);
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

			return val;
		};

		deepMap(permission.permissions, extractPermissionData);
		deepMap(permission.validation, extractPermissionData);
		deepMap(permission.presets, extractPermissionData);

		return permission;
	});

	return { permissions, requiredPermissionData, containDynamicData };
}

async function getFilterContext(schema: SchemaOverview, accountability: Accountability, requiredPermissionData: any) {
	const usersService = new UsersService({ schema });
	const rolesService = new RolesService({ schema });

	const filterContext: Record<string, any> = {};

	if (accountability.user && requiredPermissionData.$CURRENT_USER.length > 0) {
		filterContext.$CURRENT_USER = await usersService.readOne(accountability.user, {
			fields: requiredPermissionData.$CURRENT_USER,
		});
	}

	if (accountability.role && requiredPermissionData.$CURRENT_ROLE.length > 0) {
		filterContext.$CURRENT_ROLE = await rolesService.readOne(accountability.role, {
			fields: requiredPermissionData.$CURRENT_ROLE,
		});
	}

	return filterContext;
}

function processPermissions(
	accountability: Accountability,
	permissions: Permission[],
	filterContext: Record<string, any>
) {
	return permissions.map((permission) => {
		permission.permissions = parseFilter(permission.permissions, accountability!, filterContext);
		permission.validation = parseFilter(permission.validation, accountability!, filterContext);
		permission.presets = parseFilter(permission.presets, accountability!, filterContext);

		return permission;
	});
}
