import { defineModule } from '@directus/extensions';
import Collection from './routes/collection.vue';
import Item from './routes/item.vue';

export default defineModule({
	id: 'users',
	name: '$t:user_directory',
	icon: 'people_alt',
	routes: [
		{
			path: '',
			redirect: '/users/active',
		},
		{
			name: 'users-active',
			path: 'active',
			component: Collection,
			props: () => ({ status: 'active' }),
		},
		{
			name: 'users-suspended',
			path: 'suspended',
			component: Collection,
			props: () => ({ status: 'suspended' }),
		},
		{
			name: 'users-invited',
			path: 'invited',
			component: Collection,
			props: () => ({ status: 'invited' }),
		},
		{
			name: 'users-item',
			path: ':primaryKey',
			component: Item,
			props: true,
		},
		{
			path: 'roles',
			redirect: '/users',
		},
		{
			name: 'roles-collection',
			path: 'roles/:role',
			component: Collection,
			props: true,
		},
		{
			name: 'roles-item-add',
			path: 'roles/:role/+',
			component: Item,
			props: (route) => ({
				primaryKey: '+',
				role: route.params.role,
			}),
		},
	],
	preRegisterCheck(user, permissions) {
		const admin = user.admin_access;
		if (admin) return true;

		const access = permissions['directus_users']?.['read']?.access;
		return access === 'partial' || access === 'full';
	},
});
