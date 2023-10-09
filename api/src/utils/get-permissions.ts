import type { Accountability, Permission, SchemaOverview } from '@directus/types';
import { deepMap, parseFilter, parseJSON, parsePreset } from '@directus/utils';
import { cloneDeep } from 'lodash-es';
import hash from 'object-hash';
import { getCache, getCacheValue, getSystemCache, setCacheValue, setSystemCache } from '../cache.js';
import getDatabase from '../database/index.js';
import { appAccessMinimalPermissions } from '../database/system-data/app-access-permissions/index.js';
import env from '../env.js';
import logger from '../logger.js';
import { RolesService } from '../services/roles.js';
import { UsersService } from '../services/users.js';
import { mergePermissions } from './merge-permissions.js';
import { mergePermissionsForShare } from './merge-permissions-for-share.js';

export async function getPermissions(accountability: Accountability, schema: SchemaOverview) {
	const database = getDatabase();
	const { cache } = getCache();

	let permissions: Permission[] = [];

	const { user, role, app, admin, share_scope } = accountability;
	const cacheKey = `permissions-${hash({ user, role, app, admin, share_scope })}`;

	if (cache && env['CACHE_PERMISSIONS'] !== false) {
		let cachedPermissions;

		try {
			cachedPermissions = await getSystemCache(cacheKey);
		} catch (err: any) {
			logger.warn(err, `[cache] Couldn't read key ${cacheKey}. ${err.message}`);
		}

		if (cachedPermissions) {
			if (!cachedPermissions['containDynamicData']) {
				return processPermissions(accountability, cachedPermissions['permissions'], {});
			}

			const cachedFilterContext = await getCacheValue(
				cache,
				`filterContext-${hash({ user, role, permissions: cachedPermissions['permissions'] })}`
			);

			if (cachedFilterContext) {
				return processPermissions(accountability, cachedPermissions['permissions'], cachedFilterContext);
			} else {
				const {
					permissions: parsedPermissions,
					requiredPermissionData,
					containDynamicData,
				} = parsePermissions(cachedPermissions['permissions']);

				permissions = parsedPermissions;

				const filterContext = containDynamicData
					? await getFilterContext(schema, accountability, requiredPermissionData)
					: {};

				if (containDynamicData && env['CACHE_ENABLED'] !== false) {
					await setCacheValue(cache, `filterContext-${hash({ user, role, permissions })}`, filterContext);
				}

				return processPermissions(accountability, permissions, filterContext);
			}
		}
	}

	if (accountability.admin !== true) {
		const query = database.select('*').from('directus_permissions');

		if (accountability.role) {
			query.where({ role: accountability.role });
		} else {
			query.whereNull('role');
		}

		const permissionsForRole = await query;

		const {
			permissions: parsedPermissions,
			requiredPermissionData,
			containDynamicData,
		} = parsePermissions(permissionsForRole);

		permissions = parsedPermissions;

		if (accountability.app === true) {
			permissions = mergePermissions(
				'or',
				permissions,
				appAccessMinimalPermissions.map((perm) => ({ ...perm, role: accountability.role }))
			);
		}

		if (accountability.share_scope) {
			permissions = mergePermissionsForShare(permissions, accountability, schema);
		}

		const filterContext = containDynamicData
			? await getFilterContext(schema, accountability, requiredPermissionData)
			: {};

		if (cache && env['CACHE_PERMISSIONS'] !== false) {
			await setSystemCache(cacheKey, { permissions, containDynamicData });

			if (containDynamicData && env['CACHE_ENABLED'] !== false) {
				await setCacheValue(cache, `filterContext-${hash({ user, role, permissions })}`, filterContext);
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
		filterContext['$CURRENT_USER'] = await usersService.readOne(accountability.user, {
			fields: requiredPermissionData.$CURRENT_USER,
		});
	}

	if (accountability.role && requiredPermissionData.$CURRENT_ROLE.length > 0) {
		filterContext['$CURRENT_ROLE'] = await rolesService.readOne(accountability.role, {
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
		permission.presets = parsePreset(permission.presets, accountability!, filterContext);

		return permission;
	});
}
