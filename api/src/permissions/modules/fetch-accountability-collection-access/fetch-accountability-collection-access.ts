import { PERMISSION_ACTIONS } from '@directus/constants';
import type { Accountability, CollectionAccess, CollectionPermissions } from '@directus/types';
import { mapValues, uniq } from 'lodash-es';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';

/**
 * Get all permissions + minimal app permissions (if applicable) for the user + role in the current accountability.
 * The permissions will be filtered by IP access.
 */
export async function fetchAccountabilityCollectionAccess(
	accountability: Pick<Accountability, 'user' | 'roles' | 'role' | 'ip' | 'admin' | 'app'>,
	context: Context,
): Promise<CollectionAccess> {
	if (accountability.admin) {
		return mapValues(
			context.schema.collections,
			() =>
				Object.fromEntries(
					PERMISSION_ACTIONS.map((action) => [
						action,
						{
							access: 'full',
							fields: ['*'],
						},
					]),
				) as CollectionPermissions,
		);
	}

	const policies = await fetchPolicies(accountability, context);

	const permissions = await fetchPermissions({ policies, accountability }, context);

	const infos: CollectionAccess = {};

	for (const perm of permissions) {
		// Ensure that collection is in infos
		if (!infos[perm.collection]) {
			infos[perm.collection] = {
				read: { access: 'none' },
				create: { access: 'none' },
				update: { access: 'none' },
				delete: { access: 'none' },
				share: { access: 'none' },
			};
		}

		// Ensure that action with default values is in collection infos
		if (infos[perm.collection]![perm.action]?.access === 'none') {
			// If a permissions is iterated over it means that the user has access to it, so set access to 'full'
			// Set access to 'full' initially and refine that whenever a permission with filters is encountered
			infos[perm.collection]![perm.action]!.access = 'full';
		}

		const info = infos[perm.collection]![perm.action]!;

		// Set access to 'partial' if the permission has filters, which means that the user has conditional access
		if (info.access === 'full' && perm.permissions && Object.keys(perm.permissions).length > 0) {
			info.access = 'partial';
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

	// TODO Should fields by null, undefined or and empty array if no access?

	return infos;
}
