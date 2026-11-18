import { InvalidPayloadError } from '@directus/errors';
import { isReservedVersionField } from './utils.js';

/**
 * Reject field names that collide with the shadow table columns of a versioned collection. Has to run before the live
 * schema is changed, as MySQL, MariaDB, CockroachDB and Oracle can't roll back DDL once the version table sync fails.
 */
export function assertVersionSystemFields(collection: string, fields: string[]) {
	for (const field of fields) {
		if (isReservedVersionField(field)) {
			throw new InvalidPayloadError({
				reason: `Field "${field}" in collection "${collection}" conflicts with a reserved versioning field name`,
			});
		}
	}
}
