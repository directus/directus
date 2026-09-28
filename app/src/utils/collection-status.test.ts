import type { Collection, Field, Relation } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, expect, test, vi } from 'vitest';
import { getCollectionStatus, isCollectionInactive, isFieldCollectionInactive } from './collection-status';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';

function makeCollection(collection: string, meta: Record<string, unknown> | null): Collection {
	return { collection, meta, schema: {} } as Collection;
}

function makeField(collection: string, field: string): Field {
	return {
		collection,
		field,
		name: field,
		type: 'integer',
		schema: {},
		meta: { collection, field, special: null, group: null },
	} as unknown as Field;
}

function makeRelation(collection: string, field: string, relatedCollection: string): Relation {
	return {
		collection,
		field,
		related_collection: relatedCollection,
		schema: null,
		meta: { many_collection: collection, many_field: field, one_collection: relatedCollection, one_field: null },
	} as unknown as Relation;
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

test('isFieldCollectionInactive covers a field of, and a field relating to, an inactive collection', () => {
	const fieldsStore = useFieldsStore();
	const relationsStore = useRelationsStore();

	fieldsStore.fields = [
		makeField('active_collection', 'title'),
		makeField('active_collection', 'inactive_m2o'),
		makeField('active_collection', 'active_m2o'),
		makeField('inactive_collection', 'title'),
	];

	relationsStore.relations = [
		makeRelation('active_collection', 'inactive_m2o', 'inactive_collection'),
		makeRelation('active_collection', 'active_m2o', 'active_collection'),
	];

	// Plain field of an active collection
	expect(isFieldCollectionInactive({ collection: 'active_collection', field: 'title' })).toBe(false);
	// Relates to an active collection
	expect(isFieldCollectionInactive({ collection: 'active_collection', field: 'active_m2o' })).toBe(false);

	// Relates to an inactive collection
	expect(isFieldCollectionInactive({ collection: 'active_collection', field: 'inactive_m2o' })).toBe(true);
	// Belongs to an inactive collection, e.g. a nested column like `inactive_m2o.title`
	expect(isFieldCollectionInactive({ collection: 'inactive_collection', field: 'title' })).toBe(true);
});
