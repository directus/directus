import { defineModule } from '@/modules/define';
import UsersBrowse from './routes/browse/';
import UsersDetail from './routes/detail/';

export default defineModule(({ i18n }) => ({
	id: 'users',
	name: i18n.tc('user', 2),
	icon: 'people',
	routes: [
		{
			name: 'users-browse',
			path: '/',
			component: UsersBrowse,
			props: true,
		},
		{
			name: 'users-detail',
			path: '/:primaryKey',
			component: UsersDetail,
			props: true,
		},
	],
}));
