import { Collection } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { merge } from 'lodash-es';
import { setActivePinia } from 'pinia';
import { beforeEach, expect, test, vi } from 'vitest';
import { computed } from 'vue';
import { useCollectionsStore } from './collections';
import { i18n } from '@/lang';

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);
});

const mockCollection = {
	collection: 'a',
	meta: {},
	schema: {},
} as Collection;

test('parseField action should translate field name when translations are added then removed', async () => {
	const collectionsStore = useCollectionsStore();

	const mockCollectionWithTranslations = merge({}, mockCollection, {
		meta: {
			translations: [
				{
					language: 'en-US',
					translation: 'Collection A en-US',
				},
			],
		},
	});

	collectionsStore.collections = [mockCollectionWithTranslations].map(collectionsStore.prepareCollectionForApp);
	expect(collectionsStore.collections[0].name).toEqual('Collection A en-US');
	expect(i18n.global.te(`collection_names.${mockCollection.collection}`)).toBe(true);

	const mockCollectionWithMissingTranslations = merge({}, mockCollection, {
		meta: {
			translations: [
				{
					language: 'zh-CN',
					translation: 'Collection A zh-CN',
				},
			],
		},
	});

	collectionsStore.collections = [mockCollectionWithMissingTranslations].map(collectionsStore.prepareCollectionForApp);
	expect(collectionsStore.collections[0].name).toEqual('A');
	expect(i18n.global.te(`collection_names.${mockCollection.collection}`)).toBe(false);
});

test('parseField action should translate field name when all translations are removed', async () => {
	const collectionsStore = useCollectionsStore();

	const mockCollectionWithTranslations = merge({}, mockCollection, {
		meta: {
			translations: [
				{
					language: 'en-US',
					translation: 'Collection A en-US',
				},
			],
		},
	});

	collectionsStore.collections = [mockCollectionWithTranslations].map(collectionsStore.prepareCollectionForApp);
	expect(collectionsStore.collections[0].name).toEqual('Collection A en-US');
	expect(i18n.global.te(`collection_names.${mockCollection.collection}`)).toBe(true);

	const mockCollectionWithoutTranslations = merge({}, mockCollection, {
		meta: {
			translations: null,
		},
	});

	collectionsStore.collections = [mockCollectionWithoutTranslations].map(collectionsStore.prepareCollectionForApp);
	expect(collectionsStore.collections[0].name).toEqual('A');
	expect(i18n.global.te(`collection_names.${mockCollection.collection}`)).toBe(false);
});

test('getCollection finds collections and updates when they are replaced', () => {
	const collectionsStore = useCollectionsStore();
	const collection = computed(() => collectionsStore.getCollection('a'));

	expect(collection.value).toBeNull();

	collectionsStore.collections = [mockCollection, { ...mockCollection, collection: 'b' }].map(
		collectionsStore.prepareCollectionForApp,
	);

	expect(collection.value?.collection).toBe('a');
	expect(collectionsStore.getCollection('b')?.collection).toBe('b');
	expect(collectionsStore.getCollection('missing')).toBeNull();
});

test('translateCollections updates the name seen by lookups', () => {
	const collectionsStore = useCollectionsStore();
	const name = computed(() => collectionsStore.getCollection('a')?.name);

	collectionsStore.collections = [mockCollection].map(collectionsStore.prepareCollectionForApp);
	expect(name.value).toBe('A');

	i18n.global.mergeLocaleMessage('en-US', { collection_names: { a: 'Translated A' } });
	collectionsStore.translateCollections();

	expect(name.value).toBe('Translated A');

	i18n.global.mergeLocaleMessage('en-US', { collection_names: { a: undefined } });
});
