import type { Accountability, PermissionsAction } from '@directus/types';
import type { AccessService } from '../../../../services/access.js';
import type { PermissionsService } from '../../../../services/index.js';
import { fetchPermissions } from '../../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../../lib/fetch-policies.js';

/**
 * Check if you have (limited) access to a given collection by making sure there's at least 1
 * permission rule available for the collection and action combo
 */
export async function validateCollectionAccess(
	accessService: AccessService,
	permissionsService: PermissionsService,
	accountability: Accountability,
	action: PermissionsAction,
	collection: string,
) {
	const policies = await fetchPolicies(accountability, accessService);
	const permissions = await fetchPermissions({ action, policies, collections: [collection] }, { permissionsService });
	return permissions.length > 0;
}
