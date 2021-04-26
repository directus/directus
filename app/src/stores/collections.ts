import { defineStore } from 'pinia';
import api from '@/api';
import { Collection, CollectionRaw } from '@/types';
import { i18n } from '@/lang';
import { notEmpty } from '@/utils/is-empty/';
import formatTitle from '@directus/format-title';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';

export const useCollectionsStore = defineStore({
	id: 'collectionsStore',
	state: () => ({
		collections: [] as Collection[],
	}),
	getters: {
		visibleCollections: (state) => {
			return state.collections
				.filter(({ collection }) => collection.startsWith('directus_') === false)
				.filter((collection) => collection.meta?.hidden !== true);
		},
		hiddenCollections: (state) => {
			return state.collections
				.filter(({ collection }) => collection.startsWith('directus_') === false)
				.filter((collection) => collection.meta?.hidden !== false);
		},
	},
	actions: {
		async hydrate() {
			const response = await api.get(`/collections`, { params: { limit: -1 } });

			const collections: CollectionRaw[] = response.data.data;

			this.state.collections = collections.map((collection: CollectionRaw) => {
				const icon = collection.meta?.icon || 'label';
				const name = formatTitle(collection.collection);

				if (collection.meta && notEmpty(collection.meta.translations)) {
					for (let i = 0; i < collection.meta.translations.length; i++) {
						const { language, translation } = collection.meta.translations[i];

						i18n.global.mergeLocaleMessage(language, {
							collection_names: {
								[collection.collection]: translation,
							},
						});
					}
				}

				return {
					...collection,
					name,
					icon,
				};
			});

			this.translateCollections();
		},
		translateCollections() {
			this.state.collections = this.state.collections.map((collection: CollectionRaw) => {
				let name: string;

				if (i18n.global.te(`collection_names.${collection.collection}`)) {
					name = i18n.global.t(`collection_names.${collection.collection}`);
				} else {
					name = formatTitle(collection.collection);
				}

				return {
					...collection,
					name,
				};
			});
		},
		async dehydrate() {
			this.reset();
		},
		async updateCollection(collection: string, updates: Partial<Collection>) {
			try {
				await api.patch(`/collections/${collection}`, updates);
				await this.hydrate();
				notify({
					type: 'success',
					title: i18n.global.t('update_collection_success'),
				});
			} catch (err) {
				unexpectedError(err);
			}
		},
		async deleteCollection(collection: string) {
			try {
				await api.delete(`/collections/${collection}`);
				await this.hydrate();
				notify({
					type: 'success',
					title: i18n.global.t('delete_collection_success'),
				});
			} catch (err) {
				unexpectedError(err);
			}
		},
		getCollection(collectionKey: string): Collection | null {
			return this.state.collections.find((collection) => collection.collection === collectionKey) || null;
		},
	},
});
