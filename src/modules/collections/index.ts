import { defineModule } from '@/modules/define';
import CollectionsOverview from './routes/overview/';
import CollectionsBrowse from './routes/browse/';
import CollectionsDetail from './routes/detail/';

export default defineModule(({ i18n }) => ({
	id: 'collections',
	name: i18n.tc('collection', 2),
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
			component: CollectionsBrowse,
			props: true,
		},
		{
			name: 'collections-detail',
			path: '/:collection/:primaryKey',
			component: CollectionsDetail,
			props: true,
		},
	],
}));
