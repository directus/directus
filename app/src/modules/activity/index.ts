import { defineModule } from '@directus/extensions';
import ActivityCollection from './routes/collection.vue';
import ActivityItem from './routes/item.vue';

export default defineModule({
	id: 'activity',
	hidden: true,
	name: '$t:activity',
	icon: 'notifications',
	routes: [
		{
			name: 'activity-collection',
			path: '',
			component: ActivityCollection,
			props: true,
			children: [
				{
					name: 'activity-item',
					path: ':primaryKey',
					meta: {
						isFloatingView: true,
					},
					components: {
						detail: ActivityItem,
					},
				},
			],
		},
	],
});
