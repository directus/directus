import { defineModule } from '@/modules/define';

import Collection from './routes/collection.vue';
import Item from './routes/item.vue';

export default defineModule({
	id: 'users',
	name: '$t:user_directory',
	icon: 'people_alt',
	routes: [
		{
			name: 'users-collection',
			path: '/',
			component: Collection,
			props: (route) => ({
				queryFilters: route.query,
			}),
		},
		{
			name: 'users-item',
			path: '/:primaryKey',
			component: Item,
			props: (route) => ({
				primaryKey: route.params.primaryKey,
				preset: route.query,
			}),
		},
	],
	order: 10,
	preRegisterCheck(user, permissions) {
		const admin = user.role.admin_access;
		if (admin) return true;

		const permission = permissions.find(
			(permission) => permission.collection === 'directus_users' && permission.action === 'read'
		);

		return !!permission;
	},
});
