import { defineModule } from '@directus/shared/utils';
import { addQueryToPath } from '@/utils/add-query-to-path';
import RouterPass from '@/utils/router-passthrough';
import { NavigationGuard } from 'vue-router';
import CollectionOrItem from './routes/collection-or-item.vue';
import Item from './routes/item.vue';
import ItemNotFound from './routes/not-found.vue';
import NoCollections from './routes/no-collections.vue';
import { useCollectionsStore } from '@/stores';
import { Collection } from '@directus/shared/types';
import { orderBy, isNil } from 'lodash';
import { useNavigation } from './composables/use-navigation';
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

	if (
		'bookmark' in from.query &&
		typeof from.query.bookmark === 'string' &&
		'bookmark' in to.query === false &&
		to.params.collection === from.params.collection
	) {
		return addQueryToPath(to.fullPath, { bookmark: from.query.bookmark });
	}
};

export default defineModule({
	id: 'collections',
	name: '$t:collections',
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

				let firstCollection = findFirst(rootCollections);

				// If the first collection couldn't be found in any open collections, try again but with closed collections
				firstCollection = findFirst(rootCollections, { skipClosed: false });

				if (!firstCollection) return;

				return `/collections/${firstCollection.collection}`;

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
					name: 'collections-collection',
					path: '',
					component: CollectionOrItem,
					props: (route) => ({
						collection: route.params.collection,
						bookmark: route.query.bookmark,
						archive: 'archive' in route.query,
					}),
					beforeEnter: checkForSystem,
				},
				{
					name: 'collections-item',
					path: ':primaryKey',
					component: Item,
					props: true,
					beforeEnter: checkForSystem,
				},
			],
		},
		{
			name: 'collections-item-not-found',
			path: ':_(.+)+',
			component: ItemNotFound,
			beforeEnter: checkForSystem,
		},
	],
});
