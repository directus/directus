import api from '@/api';
import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import formatTitle from '@directus/format-title';
import i18n from '@/lang';

import { useProjectsStore } from '@/stores/projects';
import { useCollectionsStore } from './collections';

jest.mock('@directus/format-title');
jest.mock('@/api');
jest.mock('@/lang');

describe('Stores / collections', () => {
	let req: any = {};

	beforeAll(() => {
		Vue.config.productionTip = false;
		Vue.config.devtools = false;
		Vue.use(VueCompositionAPI);
	});

	beforeEach(() => {
		req = {};
	});

	describe('Getters / visibleCollections', () => {
		it('Filters collections starting with directus_', () => {
			const collectionsStore = useCollectionsStore(req);
			collectionsStore.state.collections = [
				{
					collection: 'test-1'
				},
				{
					collection: 'test-2'
				},
				{
					collection: 'directus_test'
				},
				{
					collection: 'test-3'
				}
			] as any;

			expect(collectionsStore.visibleCollections.value).toEqual([
				{
					collection: 'test-1'
				},
				{
					collection: 'test-2'
				},
				{
					collection: 'test-3'
				}
			]);
		});

		it('Filters collections that have the hidden flag true', () => {
			const collectionsStore = useCollectionsStore(req);
			collectionsStore.state.collections = [
				{
					collection: 'test-1',
					hidden: true
				},
				{
					collection: 'test-2',
					hidden: false
				},
				{
					collection: 'test-3',
					hidden: null
				}
			] as any;

			expect(collectionsStore.visibleCollections.value).toEqual([
				{
					collection: 'test-2',
					hidden: false
				},
				{
					collection: 'test-3',
					hidden: null
				}
			]);
		});
	});

	describe('Actions / Hydrate', () => {
		it('Calls the right endpoint', async () => {
			(api.get as jest.Mock).mockImplementation(() =>
				Promise.resolve({
					data: {
						data: []
					}
				})
			);

			const projectsStore = useProjectsStore(req);
			const collectionsStore = useCollectionsStore(req);

			projectsStore.state.currentProjectKey = 'my-project';
			await collectionsStore.hydrate();

			expect(api.get).toHaveBeenCalledWith('/my-project/collections');
		});

		it('Formats the title to use as name', async () => {
			(api.get as jest.Mock).mockImplementation(() =>
				Promise.resolve({
					data: {
						data: [
							{
								collection: 'test_collection'
							}
						]
					}
				})
			);

			const projectsStore = useProjectsStore(req);
			const collectionsStore = useCollectionsStore(req);

			projectsStore.state.currentProjectKey = 'my-project';
			await collectionsStore.hydrate();

			expect(formatTitle).toHaveBeenCalledWith('test_collection');
			expect(collectionsStore.state.collections[0].hasOwnProperty('name')).toBe(true);
		});

		it('Registers the passed translations to i18n to be registered', async () => {
			(api.get as jest.Mock).mockImplementation(() =>
				Promise.resolve({
					data: {
						data: [
							{
								collection: 'test_collection',
								translation: [
									{
										locale: 'en-US',
										translation: 'Test collection'
									},
									{
										locale: 'nl-NL',
										translation: 'Test verzameling'
									}
								]
							}
						]
					}
				})
			);

			const projectsStore = useProjectsStore(req);
			projectsStore.state.currentProjectKey = 'my-project';

			const collectionsStore = useCollectionsStore(req);
			await collectionsStore.hydrate();

			expect(i18n.mergeLocaleMessage).toHaveBeenCalledWith('en-US', {
				collections: {
					test_collection: 'Test collection'
				}
			});

			expect(i18n.mergeLocaleMessage).toHaveBeenCalledWith('nl-NL', {
				collections: {
					test_collection: 'Test verzameling'
				}
			});
		});
	});

	describe('Actions/ Dehydrate', () => {
		it('Calls reset on dehydrate', async () => {
			const collectionsStore = useCollectionsStore(req);
			jest.spyOn(collectionsStore, 'reset');
			await collectionsStore.dehydrate();
			expect(collectionsStore.reset).toHaveBeenCalled();
		});
	});
});
