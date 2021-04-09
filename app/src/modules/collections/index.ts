import { defineModule } from '@/modules/define';
import Overview from './routes/overview.vue';
import CollectionOrItem from './routes/collection-or-item.vue';
import Item from './routes/item.vue';
import ItemNotFound from './routes/not-found.vue';
import { NavigationGuard } from 'vue-router';
import { addQueryToPath } from '@/utils/add-query-to-path';

const checkForSystem: NavigationGuard = (to, from, next) => {
	if (!to.params?.collection) return next();

	if (to.params.collection === 'directus_users') {
		if (to.params.primaryKey) {
			return next(`/users/${to.params.primaryKey}`);
		} else {
			return next('/users');
		}
	}

	if (to.params.collection === 'directus_files') {
		if (to.params.primaryKey) {
			return next(`/files/${to.params.primaryKey}`);
		} else {
			return next('/files');
		}
	}

	if (to.params.collection === 'directus_activity') {
		if (to.params.primaryKey) {
			return next(`/activity/${to.params.primaryKey}`);
		} else {
			return next('/activity');
		}
	}

	if (to.params.collection === 'directus_webhooks') {
		if (to.params.primaryKey) {
			return next(`/settings/webhooks/${to.params.primaryKey}`);
		} else {
			return next('/settings/webhooks');
		}
	}

	if (
		'bookmark' in from.query &&
		typeof from.query.bookmark === 'string' &&
		'bookmark' in to.query === false &&
		to.params.collection === from.params.collection
	) {
		return next(addQueryToPath(to.fullPath, { bookmark: from.query.bookmark }));
	}

	return next();
};

export default defineModule({
	id: 'collections',
	name: '$t:collections',
	icon: 'box',
	routes: [
		{
			name: 'collections-overview',
			path: '/',
			component: Overview,
		},
		{
			name: 'collections-collection',
			path: '/:collection',
			component: CollectionOrItem,
			props: (route) => ({
				collection: route.params.collection,
				bookmark: route.query.bookmark,
			}),
			beforeEnter: checkForSystem,
		},
		{
			name: 'collections-item',
			path: '/:collection/:primaryKey',
			component: Item,
			props: true,
			beforeEnter: checkForSystem,
		},
		{
			name: 'collections-item-not-found',
			path: '/:collection/*',
			component: ItemNotFound,
			beforeEnter: checkForSystem,
		},
	],
	order: 5,
});
