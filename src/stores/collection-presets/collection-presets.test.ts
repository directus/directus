import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import { useUserStore } from '@/stores/user/';
import { useProjectsStore } from '@/stores/projects/';
import { useCollectionPresetsStore } from './collection-presets';
import defaultCollectionPreset from './default-collection-preset';
import api from '@/api';

jest.mock('@/api');

describe('Compositions / Collection Presets', () => {
	let req: any;

	beforeAll(() => {
		Vue.use(VueCompositionAPI);
	});

	beforeEach(() => {
		req = {};
	});

	describe('Hydrate', () => {
		it('Calls api.get with the correct parameters', async () => {
			(api.get as jest.Mock).mockImplementation(() =>
				Promise.resolve({
					data: {
						data: [],
					},
				})
			);

			const userStore = useUserStore(req);
			(userStore.state.currentUser as any) = { id: 15, role: 25 };
			const projectsStore = useProjectsStore(req);
			projectsStore.state.currentProjectKey = 'my-project';
			const collectionPresetsStore = useCollectionPresetsStore(req);

			await collectionPresetsStore.hydrate();

			expect(api.get).toHaveBeenCalledWith(`/my-project/collection_presets`, {
				params: {
					'filter[user][eq]': 15,
				},
			});

			expect(api.get).toHaveBeenCalledWith(`/my-project/collection_presets`, {
				params: {
					'filter[role][eq]': 25,
					'filter[user][null]': 1,
				},
			});

			expect(api.get).toHaveBeenCalledWith(`/my-project/collection_presets`, {
				params: {
					'filter[role][null]': 1,
					'filter[user][null]': 1,
				},
			});
		});
	});

	describe('Dehydrate', () => {
		it('Calls reset', async () => {
			const collectionPresetsStore = useCollectionPresetsStore(req);
			jest.spyOn(collectionPresetsStore as any, 'reset');
			await collectionPresetsStore.dehydrate();
			expect(collectionPresetsStore.reset).toHaveBeenCalled();
		});
	});

	describe('Create Preset', () => {
		it('Calls the right endpoint', async () => {
			(api.post as jest.Mock).mockImplementation(() =>
				Promise.resolve({
					data: {
						data: [],
					},
				})
			);

			const collectionPresetsStore = useCollectionPresetsStore(req);
			const projectsStore = useProjectsStore(req);
			projectsStore.state.currentProjectKey = 'my-project';

			await collectionPresetsStore.create({
				title: 'test',
			});

			expect(api.post).toHaveBeenCalledWith('/my-project/collection_presets', {
				title: 'test',
			});
		});
	});

	describe('Update Preset', () => {
		it('Calls the right endpoint', async () => {
			(api.patch as jest.Mock).mockImplementation(() =>
				Promise.resolve({
					data: {
						data: [],
					},
				})
			);

			const collectionPresetsStore = useCollectionPresetsStore(req);
			const projectsStore = useProjectsStore(req);
			projectsStore.state.currentProjectKey = 'my-project';

			await collectionPresetsStore.update(15, {
				title: 'test',
			});

			expect(api.patch).toHaveBeenCalledWith('/my-project/collection_presets/15', {
				title: 'test',
			});
		});
	});

	describe('Delete Preset', () => {
		it('Calls the right endpoint', async () => {
			(api.delete as jest.Mock).mockImplementation(() => Promise.resolve());

			const collectionPresetsStore = useCollectionPresetsStore(req);
			const projectsStore = useProjectsStore(req);
			projectsStore.state.currentProjectKey = 'my-project';

			await (collectionPresetsStore as any).delete(15);

			expect(api.delete).toHaveBeenCalledWith('/my-project/collection_presets/15');
		});
	});

	describe('Get Collection Preset for Collection', () => {
		it('Returns null if userStore currentUser is null', () => {
			const userStore = useUserStore(req);
			userStore.state.currentUser = null;
			const collectionPresetsStore = useCollectionPresetsStore(req);
			const preset = collectionPresetsStore.getPresetForCollection('articles');
			expect(preset).toBe(null);
		});

		it('Returns the default preset if there are no available presets', () => {
			const userStore = useUserStore(req);
			userStore.state.currentUser = { id: 5, role: 5 } as any;
			const collectionPresetsStore = useCollectionPresetsStore(req);
			const preset = collectionPresetsStore.getPresetForCollection('articles');
			expect(preset).toEqual({
				...defaultCollectionPreset,
				collection: 'articles',
			});
		});

		it('Ignores bookmarks', () => {
			const userStore = useUserStore(req);
			userStore.state.currentUser = { id: 5, role: 5 } as any;
			const collectionPresetsStore = useCollectionPresetsStore(req);
			collectionPresetsStore.state.collectionPresets = [
				{
					collection: 'articles',
					user: null,
					role: null,
					title: 'should be ignored',
				},
			] as any;

			const preset = collectionPresetsStore.getPresetForCollection('articles');
			expect(preset).toEqual({
				...defaultCollectionPreset,
				collection: 'articles',
			});
		});

		it('Returns the preset immediately if there is only 1', () => {
			const userStore = useUserStore(req);
			userStore.state.currentUser = { id: 5, role: 5 } as any;

			const collectionPresetsStore = useCollectionPresetsStore(req);
			collectionPresetsStore.state.collectionPresets = [
				{
					collection: 'articles',
					user: null,
					role: null,
				},
			] as any;

			const preset = collectionPresetsStore.getPresetForCollection('articles');
			expect(preset).toEqual({
				collection: 'articles',
				user: null,
				role: null,
			});
		});

		it('Prefers the user preset if it exists', () => {
			const userStore = useUserStore(req);
			userStore.state.currentUser = { id: 5, role: 5 } as any;

			const collectionPresetsStore = useCollectionPresetsStore(req);
			collectionPresetsStore.state.collectionPresets = [
				{
					collection: 'articles',
					user: null,
					role: 5,
				},
				{
					collection: 'articles',
					user: 5,
					role: null,
				},
				{
					collection: 'articles',
					user: null,
					role: null,
				},
			] as any;

			const preset = collectionPresetsStore.getPresetForCollection('articles');
			expect(preset).toEqual({
				collection: 'articles',
				user: 5,
				role: null,
			});
		});

		it('Prefers the role preset if user does not exist', () => {
			const userStore = useUserStore(req);
			userStore.state.currentUser = { id: 5, role: 5 } as any;

			const collectionPresetsStore = useCollectionPresetsStore(req);
			collectionPresetsStore.state.collectionPresets = [
				{
					collection: 'articles',
					user: null,
					role: null,
				},
				{
					collection: 'articles',
					user: null,
					role: 5,
				},
			] as any;

			const preset = collectionPresetsStore.getPresetForCollection('articles');
			expect(preset).toEqual({
				collection: 'articles',
				user: null,
				role: 5,
			});
		});

		it('Returns the last collection preset if more than 1 exist', () => {
			const userStore = useUserStore(req);
			userStore.state.currentUser = { id: 5, role: 5 } as any;

			const collectionPresetsStore = useCollectionPresetsStore(req);
			collectionPresetsStore.state.collectionPresets = [
				{
					collection: 'articles',
					user: null,
					role: null,
					test: false,
				},
				{
					collection: 'articles',
					user: null,
					role: null,
					test: false,
				},
				{
					collection: 'articles',
					user: null,
					role: null,
					test: true,
				},
			] as any;

			const preset = collectionPresetsStore.getPresetForCollection('articles');
			expect(preset).toEqual({
				collection: 'articles',
				user: null,
				role: null,
				test: true,
			});
		});
	});

	describe('Save Preset', () => {
		it('Returns null immediately if userStore is empty', async () => {
			const userStore = useUserStore(req);
			userStore.state.currentUser = null;

			const collectionPresetsStore = useCollectionPresetsStore(req);

			const result = await collectionPresetsStore.savePreset();

			expect(result).toBe(null);
		});

		it('Calls create if id is undefined or null', async () => {
			const userStore = useUserStore(req);
			userStore.state.currentUser = { id: 5 } as any;

			const collectionPresetsStore = useCollectionPresetsStore(req);
			jest.spyOn(collectionPresetsStore, 'create').mockImplementation(() => ({}));

			await collectionPresetsStore.savePreset({
				id: undefined,
			});

			expect(collectionPresetsStore.create).toHaveBeenCalledWith({ id: undefined, user: 5 });

			await collectionPresetsStore.savePreset({
				id: null,
			});

			expect(collectionPresetsStore.create).toHaveBeenCalledWith({ id: null, user: 5 });
		});

		it('Calls create when the user is not the current user', async () => {
			const userStore = useUserStore(req);
			userStore.state.currentUser = { id: 5 } as any;

			const collectionPresetsStore = useCollectionPresetsStore(req);
			jest.spyOn(collectionPresetsStore, 'create').mockImplementation(() => ({}));

			await collectionPresetsStore.savePreset({
				id: 15,
				test: 'value',
				user: null,
			});

			expect(collectionPresetsStore.create).toHaveBeenCalledWith({ test: 'value', user: 5 });
		});

		it('Calls update if the user field is already set', async () => {
			const userStore = useUserStore(req);
			userStore.state.currentUser = { id: 5 } as any;

			const collectionPresetsStore = useCollectionPresetsStore(req);
			jest.spyOn(collectionPresetsStore, 'update').mockImplementation(() => ({}));

			await collectionPresetsStore.savePreset({
				id: 15,
				test: 'value',
				user: 5,
			});

			expect(collectionPresetsStore.update).toHaveBeenCalledWith(15, {
				test: 'value',
				user: 5,
			});
		});
	});
});
