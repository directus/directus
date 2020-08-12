import { defineModule } from '@/modules/define';
import ActivityBrowse from './routes/browse/';
import ActivityDetail from './routes/detail/';

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
			props: true,
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
