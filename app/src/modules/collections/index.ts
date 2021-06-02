import { defineModule } from '@/modules/define';
import routerPassthrough from '@/utils/router-passthrough';
import { NavigationGuard } from 'vue-router';
import CollectionOrItem from './routes/collection-or-item.vue';
import Item from './routes/item.vue';
import ItemNotFound from './routes/not-found.vue';
import Overview from './routes/overview.vue';

const checkForSystem: NavigationGuard = (to) => {
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
			path: ':collection/:bookmark',
			component: routerPassthrough(),
			children: [
				{
					name: 'collections-collection',
					path: '',
					component: CollectionOrItem,
					props: true,
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
	order: 5,
});
