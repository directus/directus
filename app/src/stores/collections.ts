import api from '@/api';
import { COLLECTIONS_DENY_LIST } from '@/constants';
import { i18n } from '@/lang';
import { Collection } from '@/types/collections';
import { getLiteralInterpolatedTranslation } from '@/utils/get-literal-interpolated-translation';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';
import formatTitle from '@directus/format-title';
import { Collection as CollectionRaw, DeepPartial, Field } from '@directus/types';
import { getCollectionType } from '@directus/utils';
import { isEqual, isNil, omit, orderBy } from 'lodash';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useRelationsStore } from './relations';
import { useUserStore } from '../stores/user';

export const useCollectionsStore = defineStore('collectionsStore', () => {
	const collections = ref<Collection[]>([]);

	const visibleCollections = computed(() => {
		const userStore = useUserStore(); // Assuming useUserStore is a function that returns a store object

		// Ensure 'collections' is a reactive property available in the scope
		if(userStore.currentUser?.role?.id == 'b3ab233d-75bd-4477-8520-e4c3a4681bea'){
			return collections.value
				.filter(({ collection }) => !collection.startsWith('directus_'))
				.filter(({ meta }) => !(meta && meta.hidden === true))
				.filter(({ collection }) => collection === 'Incidents');
		} else if(userStore.currentUser?.role?.id == 'cd62eb09-a31f-4659-92e0-cbfbff9574d8' || userStore.currentUser?.role?.id == 'f0fa8dc0-6962-4d03-886d-650eafe194ed'){
			return collections.value
				.filter(({ collection }) => !collection.startsWith('directus_'))
				.filter(({ meta }) => !(meta && meta.hidden === true))
				.filter(({ meta }) => !(meta && meta.group && meta.group === 'Lists'));
		} else {
			return collections.value
				.filter(({ collection }) => !collection.startsWith('directus_'))
				.filter(({ meta }) => !(meta && meta.hidden === true));
		}
	});


	const allCollections = computed(() =>
		collections.value.filter(({ collection }) => collection.startsWith('directus_') === false),
	);

	const databaseCollections = computed(() => allCollections.value.filter((collection) => collection.schema));

	const crudSafeSystemCollections = computed(() =>
		orderBy(
			collections.value.filter((collection) => {
				return collection.collection.startsWith('directus_') === true;
			}),
			['collection'],
			['asc'],
		).filter((collection) => COLLECTIONS_DENY_LIST.includes(collection.collection) === false),
	);

	return {
		collections,
		visibleCollections,
		allCollections,
		databaseCollections,
		crudSafeSystemCollections,
		hydrate,
		dehydrate,
		prepareCollectionForApp,
		translateCollections,
		upsertCollection,
		updateCollection,
		deleteCollection,
		getCollection,
	};

	async function hydrate() {
		const response = await api.get<any>(`/collections`);

		const rawCollections: CollectionRaw[] = response.data.data;

		collections.value = rawCollections.map(prepareCollectionForApp);

	}

	async function dehydrate() {
		collections.value = [];
	}

	function prepareCollectionForApp(collection: CollectionRaw): Collection {
		const icon = collection.meta?.icon || 'database';
		const color = collection.meta?.color;
		let name = formatTitle(collection.collection);
		const type = getCollectionType(collection);

		const localesToKeep =
			collection.meta && !isNil(collection.meta.translations) && Array.isArray(collection.meta.translations)
				? collection.meta.translations.map((translation) => translation.language)
				: [];

		for (const locale of i18n.global.availableLocales) {
			if (i18n.global.te(`collection_names.${collection.collection}`, locale) && !localesToKeep.includes(locale)) {
				i18n.global.mergeLocaleMessage(locale, { collection_names: { [collection.collection]: undefined } });
			}
		}

		if (collection.meta && Array.isArray(collection.meta.translations)) {
			for (const { language, translation, singular, plural } of collection.meta.translations) {
				i18n.global.mergeLocaleMessage(language, {
					...(translation
						? {
								collection_names: {
									[collection.collection]: getLiteralInterpolatedTranslation(translation),
								},
						  }
						: {}),
					...(singular
						? {
								collection_names_singular: {
									[collection.collection]: getLiteralInterpolatedTranslation(singular),
								},
						  }
						: {}),
					...(plural
						? {
								collection_names_plural: {
									[collection.collection]: getLiteralInterpolatedTranslation(plural),
								},
						  }
						: {}),
				});
			}
		}

		if (i18n.global.te(`collection_names.${collection.collection}`)) {
			name = i18n.global.t(`collection_names.${collection.collection}`);
		}

		return {
			...collection,
			name,
			type,
			icon,
			color,
		};
	}

	function translateCollections() {
		collections.value = collections.value.map((collection) => {
			if (i18n.global.te(`collection_names.${collection.collection}`)) {
				collection.name = i18n.global.t(`collection_names.${collection.collection}`);
			}

			return collection;
		});
	}

	async function upsertCollection(collection: string, values: DeepPartial<Collection & { fields: Field[] }>) {
		const existing = getCollection(collection);

		// Strip out any fields the app might've auto-generated at some point
		const rawValues = omit(values, ['name', 'type', 'icon', 'color']);

		try {
			if (existing) {
				if (isEqual(existing, values)) return;

				const updatedCollectionResponse = await api.patch<{ data: CollectionRaw }>(
					`/collections/${collection}`,
					rawValues,
				);

				collections.value = collections.value.map((existingCollection: Collection) => {
					if (existingCollection.collection === collection) {
						return prepareCollectionForApp(updatedCollectionResponse.data.data);
					}

					return existingCollection;
				});
			} else {
				const createdCollectionResponse = await api.post<{ data: CollectionRaw }>('/collections', rawValues);

				collections.value = [...collections.value, prepareCollectionForApp(createdCollectionResponse.data.data)];
			}
		} catch (error) {
			unexpectedError(error);
		}
	}

	async function updateCollection(collection: string, updates: DeepPartial<Collection>) {
		try {
			await api.patch(`/collections/${collection}`, updates);
			await hydrate();

			notify({
				title: i18n.global.t('update_collection_success'),
			});
		} catch (error) {
			unexpectedError(error);
		}
	}

	async function deleteCollection(collection: string) {
		const relationsStore = useRelationsStore();

		try {
			await api.delete(`/collections/${collection}`);
			await Promise.all([hydrate(), relationsStore.hydrate()]);

			notify({
				title: i18n.global.t('delete_collection_success'),
			});
		} catch (error) {
			unexpectedError(error);
		}
	}

	function getCollection(collectionKey: string): Collection | null {
		return collections.value.find((collection) => collection.collection === collectionKey) || null;
	}
});
