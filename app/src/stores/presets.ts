import { createStore } from 'pinia';
import { Preset } from '@/types';
import { useUserStore } from '@/stores/';
import api from '@/api';
import { nanoid } from 'nanoid';
import { merge, cloneDeep, isEqual } from 'lodash';

const defaultPreset: Omit<Preset, 'collection'> = {
	bookmark: null,
	role: null,
	user: null,
	search: null,
	filters: null,
	layout: null,
	layout_query: null,
	layout_options: null,
	refresh_interval: null,
};

const systemDefaults: Record<string, Partial<Preset>> = {
	directus_files: {
		collection: 'directus_files',
		layout: 'cards',
		layout_query: {
			cards: {
				sort: '-uploaded_on',
			},
		},
		layout_options: {
			cards: {
				icon: 'insert_drive_file',
				title: '{{ title }}',
				subtitle: '{{ type }} • {{ filesize }}',
				size: 4,
				imageFit: 'crop',
			},
		},
	},
	directus_users: {
		collection: 'directus_users',
		layout: 'cards',
		layout_query: {
			cards: {
				sort: 'email',
			},
		},
		layout_options: {
			cards: {
				icon: 'account_circle',
				title: '{{ first_name }} {{ last_name }}',
				subtitle: '{{ email }}',
				size: 4,
			},
		},
	},
	directus_activity: {
		collection: 'directus_activity',
		layout: 'tabular',
		layout_query: {
			tabular: {
				sort: '-timestamp',
				fields: ['action', 'collection', 'timestamp', 'user'],
			},
		},
		layout_options: {
			tabular: {
				widths: {
					action: 100,
					collection: 210,
					timestamp: 240,
					user: 240,
				},
			},
		},
	},
	directus_roles: {
		collection: 'directus_roles',
		layout: 'tabular',
		layout_query: {
			tabular: {
				fields: ['icon', 'name', 'description'],
			},
		},
		layout_options: {
			tabular: {
				widths: {
					icon: 36,
					name: 248,
					description: 500,
				},
			},
		},
	},
};

let currentUpdate: Record<number, string> = {};

export const usePresetsStore = createStore({
	id: 'presetsStore',
	state: () => ({
		collectionPresets: [] as Preset[],
	}),
	actions: {
		async hydrate() {
			// Hydrate is only called for logged in users, therefore, currentUser exists
			const { id, role } = useUserStore().state.currentUser!;

			const values = await Promise.all([
				// All user saved bookmarks and presets
				api.get(`/presets`, {
					params: {
						'filter[user][_eq]': id,
						limit: -1,
					},
				}),
				// All role saved bookmarks and presets
				api.get(`/presets`, {
					params: {
						'filter[role][_eq]': role.id,
						'filter[user][_null]': true,
						limit: -1,
					},
				}),
				// All global saved bookmarks and presets
				api.get(`/presets`, {
					params: {
						'filter[role][_null]': true,
						'filter[user][_null]': true,
						limit: -1,
					},
				}),
			]);

			const presets = values.map((response) => response.data.data).flat();

			// Inject system defaults if they don't exist
			for (const systemCollection of Object.keys(systemDefaults)) {
				const existingGlobalDefault = presets.find((preset) => {
					return preset.collection === systemCollection && !preset.user && !preset.role && !preset.bookmark;
				});

				if (!existingGlobalDefault) {
					presets.push(merge({}, defaultPreset, systemDefaults[systemCollection]));
				}
			}

			this.state.collectionPresets = presets;
		},
		async dehydrate() {
			this.reset();
		},
		async create(newPreset: Partial<Preset>) {
			const response = await api.post(`/presets`, newPreset);

			this.state.collectionPresets.push(response.data.data);

			return response.data.data;
		},
		async update(id: number, updates: Partial<Preset>) {
			const updateID = nanoid();
			currentUpdate[id] = updateID;

			const response = await api.patch(`/presets/${id}`, updates);

			if (currentUpdate[id] === updateID) {
				this.state.collectionPresets = this.state.collectionPresets.map((preset) => {
					const updatedPreset = response.data.data;

					if (preset.id === updatedPreset.id) {
						return updatedPreset;
					}

					return preset;
				});
			}

			return response.data.data;
		},
		async delete(id: number) {
			await api.delete(`/presets/${id}`);

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

			const defaultPresetWithCollection = {
				...defaultPreset,
				collection: collection,
				user: userID,
			};

			const availablePresets = this.state.collectionPresets.filter((preset) => {
				const userMatches = preset.user === userID || preset.user === null;
				const roleMatches = preset.role === userRole.id || preset.role === null;
				const collectionMatches = preset.collection === collection;

				// Filter out all bookmarks
				if (preset.bookmark) return false;

				if (userMatches && collectionMatches) return true;
				if (roleMatches && collectionMatches) return true;
				return false;
			});

			if (availablePresets.length === 0) return defaultPresetWithCollection;
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
		 * The response gets added to the store.
		 */
		async savePreset(preset: Preset) {
			const userStore = useUserStore();
			if (userStore.state.currentUser === null) return null;
			const { id: userID } = userStore.state.currentUser;

			// Clone the preset to make sure the future deletes don't affect the original object
			preset = cloneDeep(preset);

			if (preset.id === undefined || preset.id === null) {
				return await this.create({
					...preset,
					user: userID,
				});
			}

			if (preset.user !== userID) {
				if (preset.hasOwnProperty('id')) delete preset.id;

				return await this.create({
					...preset,
					user: userID,
				});
			} else {
				const id = preset.id;
				delete preset.id;
				return await this.update(id, preset);
			}
		},

		saveLocal(updatedPreset: Preset) {
			this.state.collectionPresets = this.state.collectionPresets.map((preset) => {
				if (preset.id === updatedPreset.id) {
					return { ...updatedPreset };
				}

				return preset;
			});
		},

		async clearLocalSave(preset: Preset) {
			const response = await api.get(`/presets/${preset.id}`);

			this.state.collectionPresets = this.state.collectionPresets.map((preset) => {
				if (preset.id === response.data.data.id) {
					return response.data.data;
				}

				return preset;
			});
		},
	},
});
