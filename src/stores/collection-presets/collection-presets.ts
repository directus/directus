import { createStore } from 'pinia';
import { CollectionPreset } from './types';
import { useUserStore } from '@/stores/user/';
import { useProjectsStore } from '@/stores/projects/';
import api from '@/api';

import defaultCollectionPreset from './default-collection-preset';

export const useCollectionPresetsStore = createStore({
	id: 'collectionPresetsStore',
	state: () => ({
		collectionPresets: [] as CollectionPreset[],
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
						'filter[user][eq]': id,
					},
				}),
				// All role saved bookmarks and presets
				api.get(`/${currentProjectKey}/collection_presets`, {
					params: {
						'filter[role][eq]': role.id,
						'filter[user][null]': 1,
					},
				}),
				// All global saved bookmarks and presets
				api.get(`/${currentProjectKey}/collection_presets`, {
					params: {
						'filter[role][null]': 1,
						'filter[user][null]': 1,
					},
				}),
			]);

			this.state.collectionPresets = values.map((response) => response.data.data).flat();
		},
		async dehydrate() {
			this.reset();
		},
		async create(newPreset: Partial<CollectionPreset>) {
			const { currentProjectKey } = useProjectsStore().state;

			const response = await api.post(`/${currentProjectKey}/collection_presets`, newPreset);

			this.state.collectionPresets.push(response.data.data);
		},
		async update(id: number, updates: Partial<CollectionPreset>) {
			const { currentProjectKey } = useProjectsStore().state;

			const response = await api.patch(
				`/${currentProjectKey}/collection_presets/${id}`,
				updates
			);

			this.state.collectionPresets = this.state.collectionPresets.map((preset) => {
				const updatedPreset = response.data.data;
				if (preset.id === updatedPreset.id) {
					return updatedPreset;
				}

				return preset;
			});
		},
		async delete(id: number) {
			const { currentProjectKey } = useProjectsStore().state;

			await api.delete(`/${currentProjectKey}/collection_presets/${id}`);

			this.state.collectionPresets = this.state.collectionPresets.filter((preset) => {
				return preset.id !== id;
			});
		},

		/**
		 * Retrieves the most specific preset that applies to the given collection for the current
		 * user. If the user doesn't have a preset for this collection, it will fallback to the
		 * role and collection presets respectivly.
		 */
		getPresetForCollection(collection: string) {
			const userStore = useUserStore();

			if (userStore.state.currentUser === null) return null;

			const { id: userID, role: userRole } = userStore.state.currentUser;

			const defaultPreset = {
				...defaultCollectionPreset,
				collection: collection,
			};

			const availablePresets = this.state.collectionPresets.filter((preset) => {
				const userMatches = preset.user === userID || preset.user === null;
				const roleMatches = preset.role === userRole.id || preset.role === null;
				const collectionMatches = preset.collection === collection;

				// Filter out all bookmarks
				if (preset.title) return false;

				if (userMatches && collectionMatches) return true;
				if (roleMatches && collectionMatches) return true;
				return false;
			});

			if (availablePresets.length === 0) return defaultPreset;
			if (availablePresets.length === 1) return availablePresets[0];

			// In order of specificity: user-role-collection
			const userPreset = availablePresets.find((preset) => preset.user === userID);
			if (userPreset) return userPreset;

			const rolePreset = availablePresets.find((preset) => preset.role === userRole.id);
			if (rolePreset) return rolePreset;

			// If the other two already came up empty, we can assume there's only one preset. That
			// being said, as a safety precaution, we'll use the last saved preset in case there are
			// duplicates in the DB
			const collectionPreset = availablePresets[availablePresets.length - 1];
			return collectionPreset;
		},

		getBookmark(bookmarkID: number) {
			return this.state.collectionPresets.find((preset) => preset.id === bookmarkID) || null;
		},

		/**
		 * Saves the given preset. If it's the default preset, it saves it as a new preset. If the
		 * preset already exists, but doesn't have a user associated, it will create a preset for
		 * the user. If the preset already exists and is for a user, we update the preset.
		 */
		async savePreset(preset: CollectionPreset) {
			const userStore = useUserStore();
			if (userStore.state.currentUser === null) return null;
			const { id: userID } = userStore.state.currentUser;

			// Clone the preset to make sure the future deletes don't affect the original object
			preset = { ...preset };

			if (preset.id === undefined || preset.id === null) {
				return this.create({
					...preset,
					user: userID,
				});
			}

			if (preset.user !== userID) {
				if (preset.hasOwnProperty('id')) delete preset.id;

				return this.create({
					...preset,
					user: userID,
				});
			} else {
				const id = preset.id;
				delete preset.id;
				return this.update(id, preset);
			}
		},
	},
});
