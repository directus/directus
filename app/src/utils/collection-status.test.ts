import type { Collection } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, expect, test, vi } from 'vitest';
import { getCollectionInactiveReason, getCollectionStatus, isCollectionInactive } from './collection-status';
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

test('isCollectionInactive treats any status other than active as inactive', () => {
	expect(isCollectionInactive('inactive_collection')).toBe(true);
	expect(isCollectionInactive('archived_collection')).toBe(true);

	expect(isCollectionInactive('active_collection')).toBe(false);
	expect(isCollectionInactive('unconfigured_collection')).toBe(false);
	expect(isCollectionInactive('directus_users')).toBe(false);
	expect(isCollectionInactive('does_not_exist')).toBe(false);
});

test('getCollectionInactiveReason returns a status specific reason, falling back for unknown statuses', () => {
	expect(getCollectionInactiveReason('active_collection')).toBeUndefined();
	expect(getCollectionInactiveReason('does_not_exist')).toBeUndefined();

	expect(getCollectionInactiveReason('inactive_collection')).toBe('This collection is inactive');
	expect(getCollectionInactiveReason('archived_collection')).toBe('This collection is unavailable');
});
