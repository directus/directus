import { defineModule } from '@/modules/define';
import ActivityCollection from './routes/collection.vue';
import ActivityItem from './routes/item.vue';

export default defineModule(({ i18n }) => ({
	id: 'activity',
	hidden: true,
	name: i18n.t('activity'),
	icon: 'notifications',
	routes: [
		{
			name: 'activity-collection',
			path: '/',
			component: ActivityCollection,
			props: true,
			children: [
				{
					name: 'activity-item',
					path: ':primaryKey',
					components: {
						detail: ActivityItem,
					},
				},
			],
		},
	],
}));
