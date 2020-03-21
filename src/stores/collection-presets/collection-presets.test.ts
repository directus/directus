import { useUserStore } from '@/stores/user/';
import { useProjectsStore } from '@/stores/projects/';
import { useCollectionPresetsStore } from './collection-presets';
import api from '@/api';
import mountComposition from '../../../.jest/mount-composition';

jest.mock('@/api');

describe('Compositions / Collection Presets', () => {
	let req: any;

	beforeEach(() => {
		req = {};
	});

	describe('Hydrate', () => {
		it('Calls api.get with the correct parameters', () => {
			(api.get as jest.Mock).mockImplementation(() =>
				Promise.resolve({
					data: {
						data: []
					}
				})
			);

			mountComposition(async () => {
				const userStore = useUserStore(req);
				(userStore.state.currentUser as any) = { id: 15, role: 25 };
				const projectsStore = useProjectsStore(req);
				projectsStore.state.currentProjectKey = 'my-project';
				const collectionPresetsStore = useCollectionPresetsStore(req);

				await collectionPresetsStore.hydrate();

				expect(api.get).toHaveBeenCalledWith(`/my-project/collection_presets`, {
					params: {
						'filter[user][eq]': 15
					}
				});

				expect(api.get).toHaveBeenCalledWith(`/my-project/collection_presets`, {
					params: {
						'filter[role][eq]': 25,
						'filter[user][null]': 1
					}
				});

				expect(api.get).toHaveBeenCalledWith(`/my-project/collection_presets`, {
					params: {
						'filter[role][null]': 1,
						'filter[user][null]': 1
					}
				});
			});
		});
	});

	describe('Dehydrate', () => {
		it('Calls reset', () => {
			mountComposition(async () => {
				const collectionPresetsStore = useCollectionPresetsStore(req);
				jest.spyOn(collectionPresetsStore as any, 'reset');
				await collectionPresetsStore.dehydrate();
				expect(collectionPresetsStore.reset).toHaveBeenCalled();
			});
		});
	});

	describe('Create Preset', () => {
		it('Calls the right endpoint', () => {
			(api.post as jest.Mock).mockImplementation(() =>
				Promise.resolve({
					data: {
						data: []
					}
				})
			);

			mountComposition(async () => {
				const collectionPresetsStore = useCollectionPresetsStore(req);
				const projectsStore = useProjectsStore(req);
				projectsStore.state.currentProjectKey = 'my-project';

				await collectionPresetsStore.createCollectionPreset({
					title: 'test'
				});

				expect(api.post).toHaveBeenCalledWith('/my-project/collection_presets', {
					title: 'test'
				});
			});
		});
	});

	describe('Update Preset', () => {
		it('Calls the right endpoint', () => {
			(api.patch as jest.Mock).mockImplementation(() =>
				Promise.resolve({
					data: {
						data: []
					}
				})
			);

			mountComposition(async () => {
				const collectionPresetsStore = useCollectionPresetsStore(req);
				const projectsStore = useProjectsStore(req);
				projectsStore.state.currentProjectKey = 'my-project';

				await collectionPresetsStore.updateCollectionPreset(15, {
					title: 'test'
				});

				expect(api.patch).toHaveBeenCalledWith('/my-project/collection_presets/15', {
					title: 'test'
				});
			});
		});
	});

	describe('Delete Preset', () => {
		it('Calls the right endpoint', () => {
			(api.delete as jest.Mock).mockImplementation(() => Promise.resolve());

			mountComposition(async () => {
				const collectionPresetsStore = useCollectionPresetsStore(req);
				const projectsStore = useProjectsStore(req);
				projectsStore.state.currentProjectKey = 'my-project';

				await (collectionPresetsStore as any).deleteCollectionPreset(15);

				expect(api.delete).toHaveBeenCalledWith('/my-project/collection_presets/15');
			});
		});
	});
});
