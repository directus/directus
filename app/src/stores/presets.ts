import api from '@/api';
import { useUserStore } from '@/stores/user';
import { fetchAll } from '@/utils/fetch-all';
import { Preset } from '@directus/types';
import { cloneDeep, merge, orderBy } from 'lodash';
import { nanoid } from 'nanoid';
import { defineStore } from 'pinia';

const defaultPreset: Omit<Preset, 'collection'> = {
	bookmark: null,
	role: null,
	user: null,
	search: null,
	filter: null,
	layout: null,
	layout_query: null,
	layout_options: null,
	refresh_interval: null,
	icon: 'bookmark',
	color: null,
};

const systemDefaults: Record<string, Partial<Preset>> = {
	directus_files: {
		collection: 'directus_files',
		layout: 'cards',
		layout_query: {
			cards: {
				sort: ['-uploaded_on'],
			},
		},
		layout_options: {
			cards: {
				icon: 'insert_drive_file',
				title: '{{ title }}',
				subtitle: '{{ type }} • {{ filesize }}',
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
				sort: ['email'],
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
				sort: ['-timestamp'],
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
	directus_webhooks: {
		collection: 'directus_webhooks',
		layout: 'tabular',
		layout_query: {
			tabular: {
				fields: ['status', 'method', 'name', 'collections', 'actions'],
			},
		},
		layout_options: {
			tabular: {
				widths: {
					status: 32,
					method: 100,
					name: 210,
					collections: 240,
					actions: 210,
				},
			},
		},
	},
};

const currentUpdate: Record<number, string> = {};

export const usePresetsStore = defineStore({
	id: 'presetsStore',
	state: () => ({
		collectionPresets: [] as Preset[],
	}),
	getters: {
		bookmarks(): Preset[] {
			return orderBy(
				this.collectionPresets.filter((preset) => preset.bookmark !== null),
				[
					(preset) => preset.user === null && preset.role === null,
					(preset) => preset.user === null && preset.role !== null,
					'bookmark',
				]
			);
		},
	},
	actions: {
		async hydrate() {
			const userStore = useUserStore();
			if (!userStore.currentUser || 'share' in userStore.currentUser) return;

			// Hydrate is only called for logged in users, therefore, currentUser exists
			const { id, role } = userStore.currentUser;

			const values = await Promise.all([
				// All user saved bookmarks and presets
				fetchAll<any>(`/presets`, {
					params: {
						'filter[user][_eq]': id,
					},
				}),
				// All role saved bookmarks and presets
				fetchAll<any>(`/presets`, {
					params: {
						'filter[role][_eq]': role.id,
						'filter[user][_null]': true,
					},
				}),
				// All global saved bookmarks and presets
				fetchAll<any>(`/presets`, {
					params: {
						'filter[role][_null]': true,
						'filter[user][_null]': true,
					},
				}),
			]);

			const presets = values.flat();

			// Inject system defaults if they don't exist
			for (const systemCollection of Object.keys(systemDefaults)) {
				const existingGlobalDefault = presets.find((preset) => {
					return preset.collection === systemCollection && !preset.user && !preset.role && !preset.bookmark;
				});

				if (!existingGlobalDefault) {
					presets.push(merge({}, defaultPreset, systemDefaults[systemCollection]));
				}
			}

			this.collectionPresets = presets;
		},
		async dehydrate() {
			this.$reset();
		},
		async create(newPreset: Partial<Preset>) {
			const response = await api.post(`/presets`, newPreset);

			this.collectionPresets.push(response.data.data);

			return response.data.data;
		},
		async update(id: number, updates: Partial<Preset>) {
			const updateID = nanoid();
			currentUpdate[id] = updateID;

			const response = await api.patch(`/presets/${id}`, updates);

			if (currentUpdate[id] === updateID) {
				this.collectionPresets = this.collectionPresets.map((preset) => {
					const updatedPreset = response.data.data;

					if (preset.id === updatedPreset.id) {
						return updatedPreset;
					}

					return preset;
				});
			}

			return response.data.data;
		},
		async delete(ids: number[]) {
			await api.delete('/presets', { data: ids });

			this.collectionPresets = this.collectionPresets.filter((preset) => {
				return !ids.includes(preset.id!);
			});
		},

		/**
		 * Retrieves the most specific preset that applies to the given collection for the current
		 * user. If the user doesn't have a preset for this collection, it will fallback to the
		 * role and collection presets respectively.
		 */
		getPresetForCollection(collection: string) {
			const userStore = useUserStore();

			if (userStore.currentUser === null) return null;
			if (!('id' in userStore.currentUser)) return null;

			const { id: userID, role: userRole } = userStore.currentUser;

			const defaultPresetWithCollection = {
				...defaultPreset,
				collection: collection,
				user: userID,
			};

			const availablePresets = this.collectionPresets.filter((preset) => {
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
			return this.collectionPresets.find((preset) => preset.id === bookmarkID) || null;
		},

		/**
		 * Saves the given preset. If it's the default preset, it saves it as a new preset. If the
		 * preset already exists, but doesn't have a user associated, it will create a preset for
		 * the user. If the preset already exists and is for a user, we update the preset.
		 * The response gets added to the store.
		 */
		async savePreset(preset: Partial<Preset>) {
			const userStore = useUserStore();
			if (userStore.currentUser === null) return null;
			const { id: userID } = userStore.currentUser;

			// Clone the preset to make sure the future deletes don't affect the original object
			preset = cloneDeep(preset);

			if (preset.id === undefined || preset.id === null) {
				return await this.create({
					...preset,
					user: userID,
				});
			}

			if (preset.user !== userID) {
				if ('id' in preset) delete preset.id;

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
			this.collectionPresets = this.collectionPresets.map((preset) => {
				if (preset.id === updatedPreset.id) {
					return { ...updatedPreset };
				}

				return preset;
			});
		},

		async clearLocalSave(preset: Preset) {
			const response = await api.get(`/presets/${preset.id}`);

			this.collectionPresets = this.collectionPresets.map((preset) => {
				if (preset.id === response.data.data.id) {
					return response.data.data;
				}

				return preset;
			});
		},
	},
});
