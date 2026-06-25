import { appRecommendedPermissions } from '@directus/system-data';
import type { Permission } from '@directus/types';
import type { Knex } from 'knex';
import { isEqual } from 'lodash-es';
import getDatabase from '../../../database/index.js';
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

export async function checkCustomPermissionRules(opts?: { knex?: Knex | undefined }) {
	const knex = opts?.knex ?? getDatabase();
	const schema = await getSchema({ database: knex });

	const permissionService = new ItemsService('directus_permissions', {
		schema,
		knex,
	});

	const permissions = await permissionService.readByQuery({
		limit: -1,
		filter: {
			_or: [
				{ permissions: { _nnull: true } },
				{ validation: { _nnull: true } },
				{ presets: { _nnull: true } },
				{ fields: { _nnull: true } },
			],
		},
	});

	const customRulePermissions = permissions.filter((p) => hasCustomRule(p) && !isRecommendedAppPermission(p));

	return customRulePermissions.length === 0;
}
