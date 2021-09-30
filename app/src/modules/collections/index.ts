import { defineModule } from '@directus/shared/utils';
import { addQueryToPath } from '@/utils/add-query-to-path';
import RouterPass from '@/utils/router-passthrough';
import { NavigationGuard } from 'vue-router';
import CollectionOrItem from './routes/collection-or-item.vue';
import Item from './routes/item.vue';
import ItemNotFound from './routes/not-found.vue';
import Overview from './routes/overview.vue';

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
			name: 'collections-overview',
			path: '',
			component: Overview,
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
