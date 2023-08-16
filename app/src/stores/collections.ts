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

export const useCollectionsStore = defineStore('collectionsStore', () => {
	const collections = ref<Collection[]>([]);

	const visibleCollections = computed(() =>
		collections.value
			.filter(({ collection }) => collection.startsWith('directus_') === false)
			.filter((collection) => collection.meta && collection.meta?.hidden !== true)
	);

	const allCollections = computed(() =>
		collections.value.filter(({ collection }) => collection.startsWith('directus_') === false)
	);

	const databaseCollections = computed(() => allCollections.value.filter((collection) => collection.schema));

	const crudSafeSystemCollections = computed(() =>
		orderBy(
			collections.value.filter((collection) => {
				return collection.collection.startsWith('directus_') === true;
			}),
			['collection'],
			['asc']
		).filter((collection) => COLLECTIONS_DENY_LIST.includes(collection.collection) === false)
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
		const icon = collection.meta?.icon || 'label';
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

		if (collection.meta && !isNil(collection.meta.translations) && Array.isArray(collection.meta.translations)) {
			for (let i = 0; i < collection.meta.translations.length; i++) {
				const { language, translation, singular, plural } = collection.meta.translations[i];

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
					rawValues
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
		} catch (err: any) {
			unexpectedError(err);
		}
	}

	async function updateCollection(collection: string, updates: DeepPartial<Collection>) {
		try {
			await api.patch(`/collections/${collection}`, updates);
			await hydrate();

			notify({
				title: i18n.global.t('update_collection_success'),
			});
		} catch (err: any) {
			unexpectedError(err);
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
		} catch (err: any) {
			unexpectedError(err);
		}
	}

	function getCollection(collectionKey: string): Collection | null {
		return collections.value.find((collection) => collection.collection === collectionKey) || null;
	}
});
