import type { Accountability } from '@directus/types';
import { mapValues, uniq } from 'lodash-es';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';

/**
 * Get all permissions + minimal app permissions (if applicable) for the user + role in the current accountability.
 * The permissions will be filtered by IP access.
 */
export async function fetchAccountabilityCollectionAccess(
	accountability: Pick<Accountability, 'user' | 'roles' | 'role' | 'admin' | 'app'>,
	context: Context,
) {
	if (accountability.admin) {
		return mapValues(context.schema.collections, () =>
			Object.fromEntries(
				['create', 'read', 'update', 'delete', 'share'].map((action) => [
					action,
					{
						access: true,
						full_access: true,
						fields: ['*'],
					},
				]),
			),
		);
	}

	const policies = await fetchPolicies(accountability, context);

	const permissions = await fetchPermissions({ policies, accountability }, context);

	const infos: Record<string, any> = {};

	for (const perm of permissions) {
		// Ensure that collection is in infos
		if (!infos[perm.collection]) {
			infos[perm.collection] = {};
		}

		// Ensure that action with default values is in collection infos
		if (!infos[perm.collection][perm.action]) {
			// If a permissions is iterated over it means that the user has access to it, so set access to true
			// Set full_access to true initially and refine that whenever a permission with filters is encountered
			infos[perm.collection][perm.action] = {
				access: true,
				full_access: true,
			};
		}

		const info = infos[perm.collection][perm.action];

		// Set full_access to false if the permission has filters, which means that the user has conditional access
		if (info.full_access === true && perm.permissions && Object.keys(perm.permissions).length > 0) {
			info.full_access = false;
		}

		if (perm.fields && info.fields?.[0] !== '*') {
			info.fields = uniq([...(info.fields || []), ...(perm.fields || [])]);

			if (info.fields.includes('*')) {
				info.fields = ['*'];
			}
		}

		if (perm.presets) {
			info.presets = { ...(info.presets ?? {}), ...perm.presets };
		}
	}

	// TODO add missing actions here with access: false, full_access: false?
	// TODO Should fields by null, undefined or and empty array if no access?

	return infos;
}
