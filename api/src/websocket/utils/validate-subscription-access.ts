import { ForbiddenError } from '@directus/errors';
import type { Accountability, PrimaryKey } from '@directus/types';
import { fetchPermissions } from '../../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../../permissions/lib/fetch-policies.js';
import { hasItemPermissions } from '../../permissions/modules/process-ast/utils/has-item-permissions.js';
import { validateAccess } from '../../permissions/modules/validate-access/validate-access.js';
import type { Context } from '../../permissions/types.js';
import { isAdmin } from '../../utils/is-admin.js';
import type { SubscriptionEvent } from '../types.js';

/**
 * System collections whose services don't extend the ItemsService, so their items can't be validated with row level
 * permissions. Their services filter what they return by the permissions on the underlying collections instead, which
 * a deleted item can no longer be checked against, so their delete events are limited to admins.
 */
const COLLECTIONS_WITHOUT_FILTER = ['directus_collections', 'directus_fields', 'directus_relations'];

export interface ValidateSubscriptionAccessOptions {
	accountability: Accountability | null;
	collection: string;
	/** The event the subscription is limited to, undefined for all events */
	event?: SubscriptionEvent | undefined;
	item?: PrimaryKey | undefined;
}

/**
 * Verify read access to the collection, and where possible the item, a subscription targets when subscribing.
 * Create subscriptions may target an item that doesn't exist yet, so only the collection is validated for them.
 */
export async function validateSubscriptionAccess(
	{ accountability, collection, event, item }: ValidateSubscriptionAccessOptions,
	context: Context,
) {
	if (isAdmin(accountability)) return;

	const validateItem = item !== undefined && event !== 'create' && !COLLECTIONS_WITHOUT_FILTER.includes(collection);

	await validateAccess(
		{
			accountability,
			action: 'read',
			collection,
			...(validateItem ? { primaryKeys: [item] } : {}),
		},
		context,
	);

	if (event === 'delete') {
		await validateDeleteRules({ accountability, collection, itemScoped: item !== undefined }, context);
	}
}

export interface ValidateDeleteEventAccessOptions {
	accountability: Accountability | null;
	collection: string;
	/** Whether the subscription is limited to a single item, which was validated when subscribing */
	itemScoped: boolean;
}

/**
 * Verify a subscriber may receive a delete event. Deleted items can no longer be checked against row level permissions,
 * so only the collection access and the delete rules are validated.
 */
export async function validateDeleteEventAccess(
	{ accountability, collection, itemScoped }: ValidateDeleteEventAccessOptions,
	context: Context,
) {
	if (isAdmin(accountability)) return;

	await validateAccess({ accountability, action: 'read', collection }, context);

	await validateDeleteRules({ accountability, collection, itemScoped }, context);
}

async function validateDeleteRules(
	{
		accountability,
		collection,
		itemScoped,
	}: { accountability: Accountability; collection: string; itemScoped: boolean },
	context: Context,
) {
	if (COLLECTIONS_WITHOUT_FILTER.includes(collection)) {
		throw new ForbiddenError({ reason: `Only admins can subscribe to delete events of "${collection}"` });
	}

	if (itemScoped) return;

	// Without the deleted items, row level permissions can't be applied to the keys of a collection wide delete event,
	// so they are only sent to subscribers who can read every item in the collection
	const policies = await fetchPolicies(accountability, context);

	const permissions = await fetchPermissions(
		{ action: 'read', policies, collections: [collection], accountability },
		context,
	);

	if (permissions.every((permission) => hasItemPermissions(permission))) {
		throw new ForbiddenError({
			reason: `Delete events of "${collection}" require read access to every item in the collection`,
		});
	}
}
