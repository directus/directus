import CollectionsOverview from './routes/collections-overview.vue';
import { createModule } from '@/modules/create';

export default createModule({
	id: 'collections',
	register: ({ i18n }) => ({
		name: i18n.tc('collection', 2),
		routes: [
			{
				path: '/',
				component: CollectionsOverview
			}
		],
		icon: 'box'
	})
});
