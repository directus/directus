import type { CollectionMeta } from '@directus/types';
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
 * Whether a collection can be interacted with. Any status other than `active` renders the
 * collection unusable, so future statuses are covered without touching call sites.
 */
export function isCollectionUsable(collection: CollectionRef): boolean {
	const status = getCollectionStatus(collection);
	return status === undefined || status === 'active';
}

/**
 * Translated explanation of why a collection can't be interacted with, for use as a tooltip.
 * Undefined when the collection is usable.
 *
 * Only for surfaces that can already show a tooltip. Elements rendered as a native disabled
 * button (`v-list-item`, `v-checkbox`) don't dispatch mouse events, so a tooltip there never
 * fires — those surfaces are disabled without an explanation.
 */
export function getCollectionUnusableReason(collection: CollectionRef): string | undefined {
	const status = getCollectionStatus(collection);
	if (status === undefined || status === 'active') return undefined;

	const key = `collection_status.${status}.tooltip`;
	return i18n.global.te(key) ? i18n.global.t(key) : i18n.global.t('collection_status.unavailable.tooltip');
}

function resolveCollection(collection: CollectionRef): Collection | null {
	if (!collection) return null;
	if (typeof collection !== 'string') return collection;
	return useCollectionsStore().getCollection(collection);
}
