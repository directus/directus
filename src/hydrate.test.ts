import { useCollectionsStore } from './stores/collections/';
import { hydrated, hydrate, dehydrate } from './hydrate';

import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';

describe('Hydration', () => {
	beforeAll(() => {
		Vue.use(VueCompositionAPI);
	});

	describe('Hydrate', () => {
		it('Calls the correct stores', async () => {
			const collectionsStore = useCollectionsStore({});
			collectionsStore.getCollections = jest.fn();
			await hydrate();
			expect(collectionsStore.getCollections).toHaveBeenCalled();
		});

		it('Sets hydrated let after it is done', async () => {
			await hydrate();
			expect(hydrated).toBe(true);
		});

		it('Does not hydrate when already hydrated', async () => {
			await hydrate();

			const collectionsStore = useCollectionsStore({});
			collectionsStore.getCollections = jest.fn();

			await hydrate();

			expect(collectionsStore.getCollections).not.toHaveBeenCalled();
		});
	});

	describe('Dehydrate', () => {
		it('Calls resets functions of correct stores', async () => {
			const collectionsStore = useCollectionsStore({});
			collectionsStore.reset = jest.fn();
			await dehydrate();
			expect(collectionsStore.reset).toHaveBeenCalled();
		});

		it('Sets hydrated let after it is done', async () => {
			await dehydrate();
			expect(hydrated).toBe(false);
		});

		it('Does not hydrate when already hydrated', async () => {
			await dehydrate();

			const collectionsStore = useCollectionsStore({});
			collectionsStore.reset = jest.fn();

			await dehydrate();

			expect(collectionsStore.reset).not.toHaveBeenCalled();
		});
	});
});
