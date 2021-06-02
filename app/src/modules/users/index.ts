import { defineModule } from '@/modules/define';
import routerPassthrough from '@/utils/router-passthrough';
import Collection from './routes/collection.vue';
import Item from './routes/item.vue';

export default defineModule({
	id: 'users',
	name: '$t:user_directory',
	icon: 'people_alt',
	routes: [
		{
			path: '',
			component: routerPassthrough(),
			children: [
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
			],
		},
		{
			path: 'roles',
			redirect: '/users',
		},
		{
			path: 'roles/:role',
			component: routerPassthrough(),
			children: [
				{
					name: 'roles-collection',
					path: '',
					component: Collection,
					props: true,
				},
				{
					name: 'roles-item-add',
					path: '+',
					component: Item,
					props: (route) => ({
						primaryKey: '+',
						role: route.params.role,
					}),
				},
			],
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
