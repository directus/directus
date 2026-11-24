import { InvalidPayloadError } from '@directus/errors';
import {
	LINK_TABLE_PREFIX,
	SHADOW_TABLE_PREFIX,
	VERSION_REFERENCE_PREFIX,
	VERSION_SYSTEM_FIELDS,
} from './constants.js';

export function isVersioningTable(table: string) {
	return table.startsWith(SHADOW_TABLE_PREFIX) || table.startsWith(LINK_TABLE_PREFIX);
}

export function isVersionSystemField(field: string) {
	return (
		(Object.values(VERSION_SYSTEM_FIELDS) as string[]).includes(field) || field.startsWith(VERSION_REFERENCE_PREFIX)
	);
}

/**
 * Map the system columns of a shadow table row to the keys of the `directus_version` object
 */
export function toVersionSystemFields(row: Record<string, unknown>): Record<string, any> {
	return Object.fromEntries(Object.entries(VERSION_SYSTEM_FIELDS).map(([key, column]) => [key, row[column] ?? null]));
}

/**
 * Reject field names that collide with the shadow table columns of a versioned collection. Has to run before the live
 * schema is changed, as MySQL, MariaDB, CockroachDB and Oracle can't roll back DDL once the version table sync fails.
 */
export function assertVersionSystemField(collection: string, field: string) {
	if (isVersionSystemField(field)) {
		throw new InvalidPayloadError({
			reason: `Field "${field}" in collection "${collection}" conflicts with a reserved versioning field name`,
		});
	}
}
