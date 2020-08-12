import { defineModule } from '@/modules/define';

import UsersBrowse from './routes/browse/';
import UsersDetail from './routes/detail/';

export default defineModule(({ i18n }) => ({
	id: 'users',
	name: i18n.tc('user_directory'),
	icon: 'people',
	routes: [
		{
			name: 'users-browse-all',
			path: '/',
			component: UsersBrowse,
			props: (route) => ({
				queryFilters: route.query,
			}),
		},
		{
			name: 'users-detail',
			path: '/:primaryKey',
			component: UsersDetail,
			props: (route) => ({
				primaryKey: route.params.primaryKey,
				preset: route.query,
			}),
		},
	],
}));
