import { createStore } from 'pinia';
import api from '@/api';
import { Collection, CollectionRaw } from '@/types';
import i18n from '@/lang/';
import { notEmpty } from '@/utils/is-empty/';
import VueI18n from 'vue-i18n';
import formatTitle from '@directus/format-title';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';

export const useCollectionsStore = createStore({
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
						const { language, translation, singular, plural } = collection.meta.translations[i];

						i18n.mergeLocaleMessage(language, {
							collection_names: {
								[collection.collection]: translation,
							},
							collection_names_singular: {
								[collection.collection]: singular,
							},
							collection_names_plural: {
								[collection.collection]: plural,
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
				let name: string | VueI18n.TranslateResult;

				if (i18n.te(`collection_names.${collection.collection}`)) {
					name = i18n.t(`collection_names.${collection.collection}`);
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
					title: i18n.t('update_collection_success'),
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
					title: i18n.t('delete_collection_success'),
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
