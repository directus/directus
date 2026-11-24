// Prefixes are still TBD in the spec, keep every naming decision here so they can be changed in one place
export const SHADOW_TABLE_PREFIX = 'directus_shadow_';
export const LINK_TABLE_PREFIX = 'directus_link_';
export const VERSION_REFERENCE_PREFIX = 'version_ref_';

export const VERSION_SYSTEM_FIELDS = {
	id: 'version_id',
	name: 'version_name',
	type: 'version_type',
	date_created: 'version_date_created',
	date_updated: 'version_date_updated',
	user_created: 'version_user_created',
	user_updated: 'version_user_updated',
} as const;

export const VERSION_TYPES = ['draft', 'published', 'archived'] as const;

/** Field that holds the version system fields of an item in the API */
export const VERSION_FIELD = 'directus_version';
