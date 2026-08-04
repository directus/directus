import type { Collection } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, expect, test, vi } from 'vitest';
import { getCollectionStatus, getCollectionUnusableReason, isCollectionUsable } from './collection-status';
import { useCollectionsStore } from '@/stores/collections';

function makeCollection(collection: string, meta: Record<string, unknown> | null): Collection {
	return { collection, meta, schema: {} } as Collection;
}

beforeEach(() => {
	setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));

	const collectionsStore = useCollectionsStore();

	collectionsStore.collections = [
		makeCollection('active_collection', { status: 'active' }),
		makeCollection('inactive_collection', { status: 'inactive' }),
		// A future status the app doesn't know about yet
		makeCollection('archived_collection', { status: 'archived' }),
		// Collections without meta, e.g. tables that aren't configured in Directus
		makeCollection('unconfigured_collection', null),
		makeCollection('directus_users', { status: 'active' }),
	].map(collectionsStore.prepareCollectionForApp);
});

test('getCollectionStatus resolves the status by key, by collection object, and returns undefined when unknown', () => {
	const collectionsStore = useCollectionsStore();

	expect(getCollectionStatus('inactive_collection')).toBe('inactive');
	expect(getCollectionStatus(collectionsStore.getCollection('inactive_collection'))).toBe('inactive');
	expect(getCollectionStatus('unconfigured_collection')).toBeUndefined();
	expect(getCollectionStatus('does_not_exist')).toBeUndefined();
	expect(getCollectionStatus(null)).toBeUndefined();
	expect(getCollectionStatus(undefined)).toBeUndefined();
});

test('isCollectionUsable treats anything but an active or absent status as unusable', () => {
	expect(isCollectionUsable('active_collection')).toBe(true);
	expect(isCollectionUsable('unconfigured_collection')).toBe(true);
	expect(isCollectionUsable('directus_users')).toBe(true);
	expect(isCollectionUsable('does_not_exist')).toBe(true);

	expect(isCollectionUsable('inactive_collection')).toBe(false);
	expect(isCollectionUsable('archived_collection')).toBe(false);
});

test('getCollectionUnusableReason returns a status specific reason, falling back for unknown statuses', () => {
	expect(getCollectionUnusableReason('active_collection')).toBeUndefined();
	expect(getCollectionUnusableReason('does_not_exist')).toBeUndefined();

	expect(getCollectionUnusableReason('inactive_collection')).toBe('This collection is inactive');
	expect(getCollectionUnusableReason('archived_collection')).toBe('This collection is unavailable');
});
