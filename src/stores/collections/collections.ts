import { createStore } from 'pinia';
import api from '@/api';
import { Collection, CollectionRaw } from './types';
import useProjectsStore from '@/stores/projects';
import i18n from '@/lang/';
import { notEmpty } from '@/utils/is-empty';
import VueI18n, { LocaleMessages } from 'vue-i18n';
import formatTitle from '@directus/format-title';

export const useCollectionsStore = createStore({
	id: 'collections',
	state: () => ({
		collections: [] as Collection[]
	}),
	getters: {
		visibleCollections: state => {
			return state.collections
				.filter(({ collection }) => collection.startsWith('directus_') === false)
				.filter(({ hidden }) => hidden === false);
		}
	},
	actions: {
		async getCollections() {
			const projectsStore = useProjectsStore();
			const { currentProjectKey } = projectsStore.state;

			const response = await api.get(`/${currentProjectKey}/collections`);

			const collections: CollectionRaw[] = response.data.data;

			this.state.collections = collections.map((collection: CollectionRaw) => {
				let name: string | VueI18n.TranslateResult;
				const icon = collection.icon || 'box';

				if (notEmpty(collection.translation)) {
					for (let i = 0; i < collection.translation.length; i++) {
						const { locale, translation } = collection.translation[i];

						i18n.mergeLocaleMessage(locale, {
							collections: {
								[collection.collection]: translation
							}
						});
					}

					name = i18n.t(`collections.${collection.collection}`);
				} else {
					name = formatTitle(collection.collection);
				}

				return {
					...collection,
					name,
					icon
				};
			});
		}
	}
});
