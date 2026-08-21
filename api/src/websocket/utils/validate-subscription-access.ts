import type { Accountability, PrimaryKey } from '@directus/types';
import { validateAccess } from '../../permissions/modules/validate-access/validate-access.js';
import type { Context } from '../../permissions/types.js';

/**
 * Collections which services do not extend the ItemsService only supporting readAll
 */
const COLLECTIONS_WITHOUT_FILTER = ['directus_collections', 'directus_fields', 'directus_relations'];

export interface ValidateSubscriptionAccessOptions {
	accountability: Accountability | null;
	collection: string;
	item?: PrimaryKey | undefined;
}

/**
 * Verify read access to the collection, and where possible the item, a subscription targets.
 */
export async function validateSubscriptionAccess(
	{ accountability, collection, item }: ValidateSubscriptionAccessOptions,
	context: Context,
) {
	if (!accountability || accountability.admin) return;

	const validateItem = item !== undefined && !COLLECTIONS_WITHOUT_FILTER.includes(collection);

	await validateAccess(
		{
			accountability,
			action: 'read',
			collection,
			...(validateItem ? { primaryKeys: [item] } : {}),
		},
		context,
	);
}
