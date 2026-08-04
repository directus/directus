import type { CollectionMeta } from '@directus/types';
import { getRelatedCollection } from './get-related-collection';
import { i18n } from '@/lang';
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
 * Translated explanation of why a collection can't be interacted with, for use as a tooltip.
 * Undefined when the collection is active.
 *
 * Only for surfaces that can already show a tooltip. Elements rendered as a native disabled
 * button (`v-list-item`, `v-checkbox`) don't dispatch mouse events, so a tooltip there never
 * fires — those surfaces are disabled without an explanation.
 */
export function getCollectionInactiveReason(collection: CollectionRef): string | undefined {
	if (!isCollectionInactive(collection)) return undefined;

	const key = `collection_status.${getCollectionStatus(collection)}.tooltip`;
	return i18n.global.te(key) ? i18n.global.t(key) : i18n.global.t('collection_status.unavailable.tooltip');
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
