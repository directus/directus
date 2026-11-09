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

export const VERSION_TYPES = ['draft', 'published', 'archived'] as const;

export function getShadowTableName(collection: string) {
	return `${SHADOW_TABLE_PREFIX}${collection}`;
}

export function getLinkTableName(collection: string) {
	return `${LINK_TABLE_PREFIX}${collection}`;
}

/**
 * Name of the column in a shadow table that references a version of the related collection
 */
export function getVersionReferenceField(field: string) {
	return `${VERSION_REFERENCE_PREFIX}${field}`;
}

export function isShadowTable(table: string) {
	return table.startsWith(SHADOW_TABLE_PREFIX) || table.startsWith(LINK_TABLE_PREFIX);
}
