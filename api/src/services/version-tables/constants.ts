// Prefixes are still TBD in the spec, keep every naming decision here so they can be changed in one place
export const SHADOW_TABLE_PREFIX = 'directus_shadow_';
export const LINK_TABLE_PREFIX = 'directus_link_';
export const VERSION_REFERENCE_PREFIX = 'version_ref_';

export const VERSION_SYSTEM_FIELDS = {
	id: 'version_id',
	name: 'version_name',
	type: 'version_type',
	dateCreated: 'version_date_created',
	dateUpdated: 'version_date_updated',
	userCreated: 'version_user_created',
	userUpdated: 'version_user_updated',
} as const;

export const VERSION_TYPES = ['draft', 'published', 'archived'] as const;

/** Field that holds the version meta of an item in the API */
export const VERSION_META_FIELD = 'directus_version';

/**
 * Keys of the `directus_version` object in the API, mapped to the shadow table columns
 */
export const VERSION_META_KEYS: Record<string, string> = {
	id: VERSION_SYSTEM_FIELDS.id,
	name: VERSION_SYSTEM_FIELDS.name,
	type: VERSION_SYSTEM_FIELDS.type,
	date_created: VERSION_SYSTEM_FIELDS.dateCreated,
	date_updated: VERSION_SYSTEM_FIELDS.dateUpdated,
	user_created: VERSION_SYSTEM_FIELDS.userCreated,
	user_updated: VERSION_SYSTEM_FIELDS.userUpdated,
};

/**
 * Map the system columns of a shadow table row to the keys of the `directus_version` object
 */
export function toVersionMeta(row: Record<string, unknown>): Record<string, any> {
	return Object.fromEntries(Object.entries(VERSION_META_KEYS).map(([key, column]) => [key, row[column] ?? null]));
}
