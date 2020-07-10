import { defineModule } from '@/modules/define';
import CollectionsOverview from './routes/overview/';
import CollectionsBrowseOrDetail from './routes/browse-or-detail/';
import CollectionsDetail from './routes/detail/';
import CollectionsItemNotFound from './routes/not-found';

export default defineModule(({ i18n }) => ({
	id: 'collections',
	name: i18n.t('collections'),
	icon: 'box',
	routes: [
		{
			name: 'collections-overview',
			path: '/',
			component: CollectionsOverview,
		},
		{
			name: 'collections-browse',
			path: '/:collection',
			component: CollectionsBrowseOrDetail,
			props: (route) => ({
				collection: route.params.collection,
				bookmark: route.query.bookmark,
			}),
		},
		{
			name: 'collections-detail',
			path: '/:collection/:primaryKey',
			component: CollectionsDetail,
			props: true,
		},
		{
			name: 'collections-item-not-found',
			path: '/:collection/*',
			component: CollectionsItemNotFound,
		},
	],
}));
