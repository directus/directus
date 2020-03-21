import { createStore } from 'pinia';
import { CollectionPreset } from './types';
import { useUserStore } from '@/stores/user/';
import { useProjectsStore } from '@/stores/projects/';
import api from '@/api';

export const useCollectionPresetsStore = createStore({
	id: 'collectionPresetsStore',
	state: () => ({
		collectionPresets: [] as CollectionPreset[]
	}),
	actions: {
		async hydrate() {
			// Hydrate is only called for logged in users, therefore, currentUser exists
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const { id, role } = useUserStore().state.currentUser!;
			const { currentProjectKey } = useProjectsStore().state;

			const values = await Promise.all([
				// All user saved bookmarks and presets
				api.get(`/${currentProjectKey}/collection_presets`, {
					params: {
						'filter[user][eq]': id
					}
				}),
				// All role saved bookmarks and presets
				api.get(`/${currentProjectKey}/collection_presets`, {
					params: {
						'filter[role][eq]': role,
						'filter[user][null]': 1
					}
				}),
				// All global saved bookmarks and presets
				api.get(`/${currentProjectKey}/collection_presets`, {
					params: {
						'filter[role][null]': 1,
						'filter[user][null]': 1
					}
				})
			]);

			this.state.collectionPresets = values.map(response => response.data.data).flat();
		},
		async dehydrate() {
			this.reset();
		},
		async createCollectionPreset(newPreset: Partial<CollectionPreset>) {
			const { currentProjectKey } = useProjectsStore().state;

			const response = await api.post(`/${currentProjectKey}/collection_presets`, newPreset);

			this.state.collectionPresets.push(response.data.data);
		},
		async updateCollectionPreset(id: number, updates: Partial<CollectionPreset>) {
			const { currentProjectKey } = useProjectsStore().state;

			const response = await api.patch(
				`/${currentProjectKey}/collection_presets/${id}`,
				updates
			);

			this.state.collectionPresets = this.state.collectionPresets.map(preset => {
				const updatedPreset = response.data.data;
				if (preset.id === updatedPreset.id) {
					return updatedPreset;
				}

				return preset;
			});
		},
		async deleteCollectionPreset(id: number) {
			const { currentProjectKey } = useProjectsStore().state;

			await api.delete(`/${currentProjectKey}/collection_presets/${id}`);

			this.state.collectionPresets = this.state.collectionPresets.filter(preset => {
				return preset.id !== id;
			});
		}
	}
});
