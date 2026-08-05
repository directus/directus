import type { CollectionMeta } from '@directus/types';
import { getRelatedCollection } from './get-related-collection';
import { useCollectionsStore } from '@/stores/collections';
import type { Collection } from '@/types/collections';

export type CollectionStatus = CollectionMeta['status'];

export type CollectionRef = string | Collection | null | undefined;

/**
 * Resolve a collection's status. Undefined for system collections, unconfigured collections
 * (no meta) and unknown keys.
 */
export function getCollectionStatus(collection: CollectionRef): CollectionStatus | undefined {
	return resolveCollection(collection)?.meta?.status;
}

/**
 * Whether a collection is deactivated and so can't be interacted with. Any status other than
 * `active` counts as inactive, so future statuses are covered without touching call sites.
 */
export function isCollectionInactive(collection: CollectionRef): boolean {
	const status = getCollectionStatus(collection);
	return status !== undefined && status !== 'active';
}

/**
 * Whether a field can't be interacted with because of a collection status: either the field
 * belongs to an inactive collection, or it relates to one.
 */
export function isFieldCollectionInactive(field: { collection: string; field: string }): boolean {
	if (isCollectionInactive(field.collection)) return true;

	const related = getRelatedCollection(field.collection, field.field);
	if (!related) return false;

	return isCollectionInactive(related.relatedCollection) || isCollectionInactive(related.junctionCollection);
}

function resolveCollection(collection: CollectionRef): Collection | null {
	if (!collection) return null;
	if (typeof collection !== 'string') return collection;
	return useCollectionsStore().getCollection(collection);
}
