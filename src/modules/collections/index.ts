import CollectionsOverview from './routes/collections-overview.vue';
import { defineModule } from '@/modules/define';

export default defineModule({
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
