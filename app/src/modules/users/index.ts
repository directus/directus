import { defineModule } from '@directus/utils';
import Collection from './routes/collection.vue';
import Item from './routes/item.vue';

export default defineModule({
	id: 'users',
	name: '$t:user_directory',
	icon: 'people_alt',
	routes: [
		{
			name: 'users-collection',
			path: '/users/',
			component: Collection,
		},
		{
			name: 'users-item',
			path: '/users/:primaryKey',
			component: Item,
			props: true,
		},
		{
			path: '/roles',
			redirect: '/users',
		},
		{
			name: 'roles-collection',
			path: '/users/roles/:role',
			component: Collection,
			props: true,
		},
		{
			name: 'roles-item-add',
			path: '/users/roles/:role/+',
			component: Item,
			props: (route) => ({
				primaryKey: '+',
				role: route.params.role,
			}),
		},
	],
	preRegisterCheck(user, permissions) {
		const admin = user.role.admin_access;
		if (admin) return true;

		const permission = permissions.find(
			(permission) => permission.collection === 'directus_users' && permission.action === 'read'
		);

		return !!permission;
	},
});
