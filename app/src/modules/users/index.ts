import Collection from './routes/collection.vue';
import Item from './routes/item.vue';
import { defineModule } from '@directus/extensions';

export default defineModule({
	id: 'users',
	name: '$t:user_directory',
	icon: 'people_alt',
	routes: [
		{
			name: 'users-collection',
			path: '',
			component: Collection,
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
