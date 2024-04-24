import type { Accountability, PermissionsAction, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { fetchPermissions } from '../../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../../lib/fetch-policies.js';

/**
 * Check if you have (limited) access to a given collection by making sure there's at least 1
 * permission rule available for the collection and action combo
 */
export async function validateCollectionAccess(
	knex: Knex,
	schema: SchemaOverview,
	accountability: Accountability,
	action: PermissionsAction,
	collection: string,
) {
	const policies = await fetchPolicies(knex, schema, accountability);
	const permissions = await fetchPermissions(knex, schema, action, policies, [collection]);
	return permissions.length > 0;
}
