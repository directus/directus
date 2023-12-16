import { useLocalStorage } from '@/composables/use-local-storage';
import { useCollectionsStore } from '@/stores/collections';
import { addQueryToPath } from '@/utils/add-query-to-path';
import { getCollectionRoute, getItemRoute, getSystemCollectionRoute } from '@/utils/get-route';
import RouterPass from '@/utils/router-passthrough';
import { Collection } from '@directus/types';
import { defineModule } from '@directus/extensions';
import { isNil, orderBy } from 'lodash';
import { ref } from 'vue';
import { LocationQuery, NavigationGuard } from 'vue-router';
import { useNavigation } from './composables/use-navigation';
import CollectionOrItem from './routes/collection-or-item.vue';
import Item from './routes/item.vue';
import NoCollections from './routes/no-collections.vue';
import ItemNotFound from './routes/not-found.vue';
import Preview from './routes/preview.vue';

const checkForSystem: NavigationGuard = (to, from) => {
	if (!to.params?.collection) return;

	if (typeof to.params.collection === 'string') {
		const route = getSystemCollectionRoute(to.params.collection);

		if (route) {
			if (typeof to.params.primaryKey === 'string') {
				return getItemRoute(to.params.collection, to.params.primaryKey);
			} else {
				return route;
			}
		}
	}

	if (
		'bookmark' in from.query &&
		typeof from.query.bookmark === 'string' &&
		'bookmark' in to.query === false &&
		to.params.collection === from.params.collection
	) {
		return addQueryToPath(to.fullPath, { bookmark: from.query.bookmark });
	}

	return;
};

const getArchiveValue = (query: LocationQuery) => {
	if ('all' in query) {
		return 'all';
	} else if ('archived' in query) {
		return 'archived';
	} else {
		return null;
	}
};

export default defineModule({
	id: 'content',
	name: '$t:content',
	icon: 'box',
	routes: [
		{
			name: 'no-collections',
			path: '',
			component: NoCollections,
			beforeEnter() {
				const collectionsStore = useCollectionsStore();
				const { activeGroups } = useNavigation(ref(null));

				if (collectionsStore.visibleCollections.length === 0) return;

				const rootCollections = orderBy(
					collectionsStore.visibleCollections.filter((collection) => {
						return isNil(collection?.meta?.group);
					}),
					['meta.sort', 'collection'],
				);

				const { data } = useLocalStorage('last-accessed-collection');

				if (
					typeof data.value === 'string' &&
					collectionsStore.visibleCollections.find((visibleCollection) => visibleCollection.collection === data.value)
				) {
					return getCollectionRoute(data.value);
				}

				let firstCollection = findFirst(rootCollections);

				// If the first collection couldn't be found in any open collections, try again but with closed collections
				firstCollection = findFirst(rootCollections, { skipClosed: false });

				if (!firstCollection) return;

				return getCollectionRoute(firstCollection.collection);

				function findFirst(collections: Collection[], { skipClosed } = { skipClosed: true }): Collection | void {
					for (const collection of collections) {
						if (collection.schema) {
							return collection;
						}

						// Don't default to a collection in a currently closed folder
						if (skipClosed && activeGroups.value.includes(collection.collection) === false) continue;

						const children = orderBy(
							collectionsStore.visibleCollections.filter((childCollection) => {
								return collection.collection === childCollection.meta?.group;
							}),
							['meta.sort', 'collection'],
						);

						const first = findFirst(children);

						if (first) return first;
					}
				}
			},
		},
		{
			path: ':collection',
			component: RouterPass,
			children: [
				{
					name: 'content-collection',
					path: '',
					component: CollectionOrItem,
					props: (route) => {
						const archive = getArchiveValue(route.query);
						return {
							collection: route.params.collection,
							bookmark: route.query.bookmark,
							archive,
						};
					},
					beforeEnter: checkForSystem,
				},
				{
					name: 'content-item',
					path: ':primaryKey',
					component: Item,
					props: true,
					beforeEnter: checkForSystem,
				},
			],
		},
		{
			name: 'content-item-preview',
			path: ':collection/:primaryKey/preview',
			component: Preview,
			props: true,
		},
		{
			name: 'content-item-not-found',
			path: ':_(.+)+',
			component: ItemNotFound,
			beforeEnter: checkForSystem,
		},
	],
});
