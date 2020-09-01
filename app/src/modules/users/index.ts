import { defineModule } from '@/modules/define';

import UsersBrowse from './routes/browse.vue';
import UsersDetail from './routes/detail.vue';

export default defineModule(({ i18n }) => ({
	id: 'users',
	name: i18n.tc('user_directory'),
	icon: 'people_alt',
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
	order: 10,
	preRegisterCheck(user, permissions) {
		const admin = user.role.admin;
		if (admin) return true;

		const permission = permissions.find(
			(permission) => permission.collection === 'directus_users' && permission.action === 'read'
		);
		return !!permission;
	},
}));
