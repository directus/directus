import { useEnv } from '@directus/env';
import type { Accountability, Permission } from '@directus/types';
import { getSimpleHash } from '@directus/utils';
import { getCache, getCacheValue, setCacheValue } from '../../cache.js';
import type { Context } from '../types.js';
import {
	extractRequiredDynamicVariableContext,
	type RequiredPermissionContext,
} from './extract-required-dynamic-variable-context.js';

export interface FetchDynamicVariableContext {
	accountability: Pick<Accountability, 'user' | 'role' | 'roles'>;
	policies: string[];
	permissions: Permission[];
}

export async function fetchDynamicVariableContext(options: FetchDynamicVariableContext, context: Context) {
	const { UsersService } = await import('../../services/users.js');
	const { RolesService } = await import('../../services/roles.js');
	const { PoliciesService } = await import('../../services/policies.js');

	const contextData: Record<string, any> = {};

	const permissionContext = extractRequiredDynamicVariableContext(options.permissions);

	if (options.accountability.user && (permissionContext.$CURRENT_USER?.size ?? 0) > 0) {
		contextData['$CURRENT_USER'] = await fetchContextData(
			'$CURRENT_USER',
			permissionContext,
			{ user: options.accountability.user },
			async (fields) => {
				const usersService = new UsersService(context);

				return await usersService.readOne(options.accountability.user!, {
					fields,
				});
			},
		);
	}

	if (options.accountability.role && (permissionContext.$CURRENT_ROLE?.size ?? 0) > 0) {
		contextData['$CURRENT_ROLE'] = await fetchContextData(
			'$CURRENT_ROLE',
			permissionContext,
			{ role: options.accountability.role },
			async (fields) => {
				const usersService = new RolesService(context);

				return await usersService.readOne(options.accountability.role!, {
					fields,
				});
			},
		);
	}

	if (options.accountability.roles.length > 0 && (permissionContext.$CURRENT_ROLES?.size ?? 0) > 0) {
		contextData['$CURRENT_ROLES'] = await fetchContextData(
			'$CURRENT_ROLES',
			permissionContext,
			{ roles: options.accountability.roles },
			async (fields) => {
				const rolesService = new RolesService(context);

				return await rolesService.readMany(options.accountability.roles, {
					fields,
				});
			},
		);
	}

	if (options.policies.length > 0) {
		if ((permissionContext.$CURRENT_POLICIES?.size ?? 0) > 0) {
			// Always add the id field
			permissionContext.$CURRENT_POLICIES.add('id');

			contextData['$CURRENT_POLICIES'] = await fetchContextData(
				'$CURRENT_POLICIES',
				permissionContext,
				{ policies: options.policies },
				async (fields) => {
					const policiesService = new PoliciesService(context);

					return await policiesService.readMany(options.policies, {
						fields,
					});
				},
			);
		} else {
			// Always create entries for the policies with the `id` field present
			contextData['$CURRENT_POLICIES'] = options.policies.map((id) => ({ id }));
		}
	}

	return contextData;
}

async function fetchContextData(
	key: keyof RequiredPermissionContext,
	permissionContext: RequiredPermissionContext,
	cacheContext: Record<string, any>,
	fetch: (fields: string[]) => Promise<Record<string, any>>,
) {
	const { cache } = getCache();
	const env = useEnv();

	const fields = Array.from(permissionContext[key]!);

	const cacheKey = cache
		? `filter-context-${key.slice(1)}-${getSimpleHash(JSON.stringify({ ...cacheContext, fields }))}`
		: '';

	let data = undefined;

	if (cache) {
		data = await getCacheValue(cache, cacheKey);
	}

	if (!data) {
		data = await fetch(fields);

		if (cache && env['CACHE_ENABLED'] !== false) {
			await setCacheValue(cache, cacheKey, data);
		}
	}

	return data;
}
