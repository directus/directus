import { defineModule } from '@directus/utils';
import { addQueryToPath } from '@/utils/add-query-to-path';
import RouterPass from '@/utils/router-passthrough';
import { LocationQuery, NavigationGuard } from 'vue-router';
import CollectionOrItem from './routes/collection-or-item.vue';
import Item from './routes/item.vue';
import Preview from './routes/preview.vue';
import ItemNotFound from './routes/not-found.vue';
import NoCollections from './routes/no-collections.vue';
import { useCollectionsStore } from '@/stores/collections';
import { Collection } from '@directus/types';
import { orderBy, isNil } from 'lodash';
import { useNavigation } from './composables/use-navigation';
import { useLocalStorage } from '@/composables/use-local-storage';
import { ref } from 'vue';

const checkForSystem: NavigationGuard = (to, from) => {
	if (!to.params?.collection) return;

	if (to.params.collection === 'directus_users') {
		if (to.params.primaryKey) {
			return `/users/${to.params.primaryKey}`;
		} else {
			return '/users';
		}
	}

	if (to.params.collection === 'directus_files') {
		if (to.params.primaryKey) {
			return `/files/${to.params.primaryKey}`;
		} else {
			return '/files';
		}
	}

	if (to.params.collection === 'directus_activity') {
		if (to.params.primaryKey) {
			return `/activity/${to.params.primaryKey}`;
		} else {
			return '/activity';
		}
	}

	if (to.params.collection === 'directus_webhooks') {
		if (to.params.primaryKey) {
			return `/settings/webhooks/${to.params.primaryKey}`;
		} else {
			return '/settings/webhooks';
		}
	}

	if (to.params.collection === 'directus_presets') {
		if (to.params.primaryKey) {
			return `/settings/presets/${to.params.primaryKey}`;
		} else {
			return '/settings/presets';
		}
	}

	if (to.params.collection === 'directus_translations') {
		if (to.params.primaryKey) {
			return `/settings/translations/${to.params.primaryKey}`;
		} else {
			return '/settings/translations';
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
					['meta.sort', 'collection']
				);

				const { data } = useLocalStorage('last-accessed-collection');

				if (
					data.value &&
					collectionsStore.visibleCollections.find((visibleCollection) => visibleCollection.collection === data.value)
				) {
					return `/content/${data.value}`;
				}

				let firstCollection = findFirst(rootCollections);

				// If the first collection couldn't be found in any open collections, try again but with closed collections
				firstCollection = findFirst(rootCollections, { skipClosed: false });

				if (!firstCollection) return;

				return `/content/${firstCollection.collection}`;

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
							['meta.sort', 'collection']
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
