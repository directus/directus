import { defineModule } from '@/modules/define';
import CollectionsOverview from './routes/overview/';
import CollectionsBrowse from './routes/browse/';
import CollectionsDetail from './routes/detail/';

export default defineModule({
	id: 'collections',
	register: ({ i18n }) => ({
		name: i18n.tc('collection', 2),
		routes: [
			{
				path: '/',
				component: CollectionsOverview
			},
			{
				path: '/:collection',
				component: CollectionsBrowse,
				props: true
			},
			{
				path: '/:collection/:primaryKey',
				component: CollectionsDetail,
				props: true
			}
		],
		icon: 'box'
	})
});
