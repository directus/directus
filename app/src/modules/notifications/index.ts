import { defineModule } from '@directus/shared/utils';
import NotificationsCollection from './routes/collection.vue';
import NotificationsItem from './routes/item.vue';

export default defineModule({
	id: 'notifications',
	hidden: true,
	name: '$t:notifications',
	icon: 'notifications',
	routes: [
		{
			name: 'notifications-collection',
			path: '',
			component: NotificationsCollection,
			props: true,
			children: [
				{
					name: 'notifications-item',
					path: ':primaryKey',
					components: {
						detail: NotificationsItem,
					},
				},
			],
		},
	],
});
