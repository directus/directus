import { defineModule } from '@/modules/define';

import UsersBrowse from './routes/browse/';
import UsersDetail from './routes/detail/';

export default defineModule(({ i18n }) => ({
	id: 'users',
	name: i18n.tc('user', 2),
	icon: 'people',
	routes: [
		{
			path: '/',
			redirect: '/all',
		},
		{
			name: 'users-browse-all',
			path: '/all',
			component: UsersBrowse,
		},
		{
			name: 'users-detail-add-new',
			path: '/+',
			component: UsersDetail,
			props: {
				primaryKey: '+',
			},
		},
		{
			name: 'users-browse-role',
			path: '/:role',
			component: UsersBrowse,
			props: true,
		},
		{
			name: 'users-detail',
			path: '/:role/:primaryKey',
			component: UsersDetail,
			props: true,
		},
	],
}));
