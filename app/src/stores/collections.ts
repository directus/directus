import api from '@/api';
import { COLLECTIONS_DENY_LIST } from '@/constants';
import { i18n } from '@/lang';
import { Collection } from '@/types/collections';
import { flattenGroupedCollections } from '@/utils/flatten-grouped-collections';
import { getLiteralInterpolatedTranslation } from '@/utils/get-literal-interpolated-translation';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';
import formatTitle from '@directus/format-title';
import { Collection as CollectionRaw, DeepPartial, Field } from '@directus/types';
import { getCollectionType } from '@directus/utils';
import { isEqual, isNil, omit } from 'lodash';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useRelationsStore } from './relations';
import { isSystemCollection } from '@directus/system-data';

export const useCollectionsStore = defineStore('collectionsStore', () => {
	const collections = ref<Collection[]>([]);

	const sortedCollections = computed(() => flattenGroupedCollections(collections.value));

	/**
	 * All system collections
	 */
	const systemCollections = computed(() =>
		sortedCollections.value.filter(({ collection }) => isSystemCollection(collection)),
	);

	/**
	 * All collections excluding system collections
	 */
	const allCollections = computed(() =>
		sortedCollections.value.filter(({ collection }) => isSystemCollection(collection) === false),
	);

	/**
	 * All non-system collections that have a meta object, i.e. are configured in Directus
	 */
	const configuredCollections = computed(() => allCollections.value.filter((collection) => collection.meta));

	/**
	 * All non-system collections that are configured and visible (not hidden)
	 */
	const visibleCollections = computed(() =>
		configuredCollections.value.filter((collection) => collection.meta?.hidden !== true),
	);

	/**
	 * All non-system collections that are configured and have a corresponding database table
	 */
	const databaseCollections = computed(() => allCollections.value.filter((collection) => collection.schema));

	/**
	 * All system collections that are safe to CRUD
	 */
	const crudSafeSystemCollections = computed(() =>
		systemCollections.value.filter((collection) => !COLLECTIONS_DENY_LIST.includes(collection.collection)),
	);

	return {
		collections,
		sortedCollections,
		allCollections,
		visibleCollections,
		configuredCollections,
		databaseCollections,
		systemCollections,
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
