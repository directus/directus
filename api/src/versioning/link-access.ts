import type { Accountability, PermissionsAction, PrimaryKey, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { getShadowTableName, isVersionedCollection } from '../services/version-tables/constants.js';

/**
 * Link tables have no permissions of their own. They mirror the shadow table of the same collection,
 * or the live collection if it isn't versioned.
 */
export async function validateLinkAccess(
	options: { collection: string; action: PermissionsAction; keys: PrimaryKey[]; accountability: Accountability | null },
	context: { knex: Knex; schema: SchemaOverview },
) {
	const { collection, action, keys, accountability } = options;

	if (!accountability || keys.length === 0) return;

	if (isVersionedCollection(context.schema, collection)) {
		await validateAccess({ accountability, action, collection: getShadowTableName(collection) }, context);
	} else {
		await validateAccess({ accountability, action, collection, primaryKeys: keys }, context);
	}
}
