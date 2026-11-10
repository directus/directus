import type { SchemaOverview } from '@directus/types';
import { getSimpleHash } from '@directus/utils';

// Prefixes are still TBD in the spec, keep every naming decision in this file so they can be changed in one place
export const SHADOW_TABLE_PREFIX = 'directus_shadow_';
export const LINK_TABLE_PREFIX = 'directus_link_';
export const VERSION_REFERENCE_PREFIX = 'version_ref_';

export const VERSION_META_FIELDS = {
	id: 'version_id',
	name: 'version_name',
	type: 'version_type',
	dateCreated: 'version_date_created',
	dateUpdated: 'version_date_updated',
	userCreated: 'version_user_created',
	userUpdated: 'version_user_updated',
} as const;

/**
 * Keys of the `directus_version` object in the API, mapped to the shadow table columns
 */
export const VERSION_META_KEYS: Record<string, string> = {
	id: VERSION_META_FIELDS.id,
	name: VERSION_META_FIELDS.name,
	type: VERSION_META_FIELDS.type,
	date_created: VERSION_META_FIELDS.dateCreated,
	date_updated: VERSION_META_FIELDS.dateUpdated,
	user_created: VERSION_META_FIELDS.userCreated,
	user_updated: VERSION_META_FIELDS.userUpdated,
};

export const VERSION_TYPES = ['draft', 'published', 'archived'] as const;

/**
 * Longest identifier that is safe on all vendors, Postgres truncates identifiers longer than 63 characters.
 * Matches the limit of `getDefaultIndexName`.
 */
export const MAX_IDENTIFIER_LENGTH = 60;

/**
 * Prefix a name, replacing the end of the name with a hash if the result would exceed the identifier length limit.
 * Otherwise vendors would truncate the name, causing it to no longer match and possibly collide with other names.
 */
function prefixName(prefix: string, name: string) {
	const prefixed = `${prefix}${name}`;

	if (prefixed.length <= MAX_IDENTIFIER_LENGTH) return prefixed;

	const suffix = `__${getSimpleHash(prefixed)}`;

	return `${prefixed.substring(0, MAX_IDENTIFIER_LENGTH - suffix.length)}${suffix}`;
}

export function getShadowTableName(collection: string) {
	return prefixName(SHADOW_TABLE_PREFIX, collection);
}

export function getLinkTableName(collection: string) {
	return prefixName(LINK_TABLE_PREFIX, collection);
}

/**
 * Name of the column in a shadow table that references a version of the related collection
 */
export function getVersionReferenceField(field: string) {
	return prefixName(VERSION_REFERENCE_PREFIX, field);
}

/**
 * A collection is versioned as long as its shadow table exists, which keeps this in sync with the database
 */
export function isVersionedCollection(schema: SchemaOverview, collection: string) {
	return getShadowTableName(collection) in schema.collections;
}

export function isShadowTable(table: string) {
	return table.startsWith(SHADOW_TABLE_PREFIX) || table.startsWith(LINK_TABLE_PREFIX);
}
