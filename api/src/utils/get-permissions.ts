import { Accountability, Permission, SchemaOverview } from '@directus/shared/types';
import { parseFilter, parsePreset } from '@directus/shared/utils';
import hash from 'object-hash';
import { getCache, getSystemCache, setSystemCache, getCacheValue, setCacheValue } from '../cache';
import getDatabase from '../database';
import { appAccessMinimalPermissions } from '../database/system-data/app-access-permissions';
import env from '../env';
import { mergePermissions } from '../utils/merge-permissions';
import { parsePermissions } from '../utils/parse-permissions';
import { getFilterContext } from '../utils/get-filter-context';
import { mergePermissionsForShare } from './merge-permissions-for-share';
import logger from '../logger';

export async function getPermissions(accountability: Accountability, schema: SchemaOverview) {
	const database = getDatabase();
	const { cache } = getCache();

	let permissions: Permission[] = [];

	const { user, role, app, admin, share_scope } = accountability;
	const cacheKey = `permissions-${hash({ user, role, app, admin, share_scope })}`;

	if (cache && env.CACHE_PERMISSIONS !== false) {
		let cachedPermissions;

		try {
			cachedPermissions = await getSystemCache(cacheKey);
		} catch (err: any) {
			logger.warn(err, `[cache] Couldn't read key ${cacheKey}. ${err.message}`);
		}

		if (cachedPermissions) {
			if (!cachedPermissions.containDynamicData) {
				return processPermissions(accountability, cachedPermissions.permissions, {});
			}

			const cachedFilterContext = await getCacheValue(
				cache,
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

		if (cache && env.CACHE_PERMISSIONS !== false) {
			await setSystemCache(cacheKey, { permissions, containDynamicData });

			if (containDynamicData && env.CACHE_ENABLED !== false) {
				await setCacheValue(cache, `filterContext-${hash({ user, role, permissions })}`, filterContext);
			}
		}

		return processPermissions(accountability, permissions, filterContext);
	}

	return permissions;
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
