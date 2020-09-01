import { defineModule } from '@/modules/define';
import ActivityBrowse from './routes/browse.vue';
import ActivityDetail from './routes/detail.vue';

export default defineModule(({ i18n }) => ({
	id: 'activity',
	hidden: true,
	name: i18n.t('activity'),
	icon: 'notifications',
	routes: [
		{
			name: 'activity-browse',
			path: '/',
			component: ActivityBrowse,
			props: (route) => ({
				queryFilters: route.query,
				primaryKey: route.params.primaryKey,
			}),
			children: [
				{
					name: 'activity-detail',
					path: ':primaryKey',
					components: {
						detail: ActivityDetail,
					},
				},
			],
		},
	],
}));
