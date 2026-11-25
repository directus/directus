import type { Accountability, PermissionsAction, PrimaryKey, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';

/**
 * Link tables have no permissions of their own. They extend the items of the live collection, so they require access to
 * those items.
 */
export async function validateLinkAccess(
	options: { collection: string; action: PermissionsAction; keys: PrimaryKey[]; accountability: Accountability | null },
	context: { knex: Knex; schema: SchemaOverview },
) {
	const { collection, action, keys, accountability } = options;

	if (!accountability || keys.length === 0) return;

	await validateAccess({ accountability, action, collection, primaryKeys: keys }, context);
}
