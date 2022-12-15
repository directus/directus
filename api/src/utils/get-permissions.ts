import { Accountability, Permission, SchemaOverview } from '@directus/shared/types';
import { deepMap, parseFilter, parseJSON, parsePreset } from '@directus/shared/utils';
import { cloneDeep } from 'lodash';
import hash from 'object-hash';
import { getCache, getSystemCache, setSystemCache } from '../cache';
import getDatabase from '../database';
import { appAccessMinimalPermissions } from '../database/system-data/app-access-permissions';
import env from '../env';
import { RolesService } from '../services/roles';
import { UsersService } from '../services/users';
import { mergePermissions } from '../utils/merge-permissions';
import { mergePermissionsForShare } from './merge-permissions-for-share';

export async function getPermissions(accountability: Accountability, schema: SchemaOverview) {
	const database = getDatabase();
	const { cache } = getCache();

	let permissions: Permission[] = [];

	const { user, role, app, admin, share_scope } = accountability;
	const cacheKey = `permissions-${hash({ user, role, app, admin, share_scope })}`;

	if (env.CACHE_PERMISSIONS !== false) {
		const cachedPermissions = await getSystemCache(cacheKey);

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
				const {
					permissions: parsedPermissions,
					requiredPermissionData,
					containDynamicData,
				} = parsePermissions(cachedPermissions.permissions);

				permissions = parsedPermissions;

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
		const roleQuery = database
			.withRecursive('ancestors', (qb) => {
				qb.select('id', 'parent_role', 'name').from('directus_roles').where({ id: accountability.role });
				qb.unionAll((qb) => {
					qb.select('r.id', 'r.parent_role', 'r.name')
						.from('directus_roles as r')
						.join('ancestors as a', 'a.parent_role', 'r.id');
				});
			})
			.select('*')
			.from('ancestors');
		const roleHierarchy = await roleQuery;

		const query = database.select('*').from('directus_permissions');

		if (roleHierarchy.length > 0) {
			query
				.whereIn(
					'role',
					roleHierarchy.map((p) => p.id)
				)
				.orWhereNull('role');
		} else {
			query.whereNull('role');
		}

		const permissionsForRole = (await query).map((permission) => ({ ...permission, role: accountability.role }));

		const {
			permissions: parsedPermissions,
			requiredPermissionData,
			containDynamicData,
		} = parsePermissions(permissionsForRole);

		if (roleHierarchy.length > 0) {
			permissions = roleHierarchy.reduce((acc, role) => {
				const filteredPerms = parsedPermissions.filter((p) => p.role === role.id);
				return acc === null ? filteredPerms : mergePermissions('or', acc, filteredPerms);
			}, null);
		} else {
			permissions = parsedPermissions;
		}

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

		if (env.CACHE_PERMISSIONS !== false) {
			await setSystemCache(cacheKey, { permissions, containDynamicData });

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
		permission.presets = parsePreset(permission.presets, accountability!, filterContext);

		return permission;
	});
}
