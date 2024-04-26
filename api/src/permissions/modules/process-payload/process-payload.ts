import { ForbiddenError } from '@directus/errors';
import type { Accountability, Item, PermissionsAction, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';

export async function processPayload(
	knex: Knex,
	schema: SchemaOverview,
	accountability: Accountability,
	action: PermissionsAction,
	collection: string,
	payload: Item,
) {
	if (accountability.admin) {
		return;
	}

	const policies = await fetchPolicies(knex, schema, accountability);
	const permissions = await fetchPermissions(knex, schema, action, policies, [collection]);

	if (permissions.length === 0) {
		throw new ForbiddenError({
			reason: `You don't have permission to "${action}" from collection "${collection}" or it does not exist.`,
		});
	}

	// Create path fieldMap for all paths targeted in payload

	// Validate every path

	// TODO Merge and inject presets.. maybe? Usage is super low, discuss whether to ignore it here
	// and move them to "dynamic default values"

	// If we're gonna modify payload, don't forget to cloneDeep. Don't want to mutate the original
}
