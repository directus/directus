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
