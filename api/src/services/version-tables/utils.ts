import { InvalidPayloadError } from '@directus/errors';
import { isPlainObject } from 'lodash-es';
import {
	LINK_TABLE_PREFIX,
	SHADOW_TABLE_PREFIX,
	VERSION_FIELD,
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
 * Move the system columns of a shadow table row into the `directus_version` object. Only the top level is formatted,
 * as nested values are either field values like JSON or related items that are formatted when they're read.
 */
export function nestVersionSystemFields(row: Record<string, unknown>): Record<string, any> {
	const result: Record<string, unknown> = {};
	const system: Record<string, unknown> = {};
	let hasSystemFields = false;

	for (const [field, value] of Object.entries(row)) {
		const key = SYSTEM_FIELD_KEYS.get(field);

		if (key !== undefined) {
			system[key] = value ?? null;
			hasSystemFields = true;
		} else {
			result[field] = value;
		}
	}

	if (hasSystemFields) {
		result[VERSION_FIELD] = isPlainObject(result[VERSION_FIELD])
			? { ...(result[VERSION_FIELD] as object), ...system }
			: system;
	}

	return result;
}

/**
 * Move the keys of the `directus_version` object back into the system columns of a shadow table row. Only the top
 * level is unformatted, as nested values are field values like JSON that have to be kept as is.
 */
export function flattenVersionSystemFields(payload: Record<string, unknown>): Record<string, any> {
	const { [VERSION_FIELD]: system, ...result } = payload;

	if (!isPlainObject(system)) return payload;

	for (const [key, value] of Object.entries(system as Record<string, unknown>)) {
		const column = VERSION_SYSTEM_FIELDS[key as keyof typeof VERSION_SYSTEM_FIELDS];

		if (column === undefined) {
			throw new InvalidPayloadError({ reason: `"${VERSION_FIELD}.${key}" isn't a version system field` });
		}

		result[column] = value;
	}

	return result;
}

const SYSTEM_FIELD_KEYS = new Map<string, string>(
	Object.entries(VERSION_SYSTEM_FIELDS).map(([key, column]) => [column, key]),
);

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
