import { defineModule } from '@directus/extensions';
import Collection from './routes/collection.vue';
import Item from './routes/item.vue';
import { NavigationGuard } from 'vue-router';
import { addQueryToPath } from '@/utils/add-query-to-path';

const checkForSystem: NavigationGuard = (to, from) => {
	if (
		'bookmark' in from.query &&
		typeof from.query.bookmark === 'string' &&
		'bookmark' in to.query === false &&
		'primaryKey' in to.params
	) {
		return addQueryToPath(to.fullPath, { bookmark: from.query.bookmark });
	}

	return;
};

export default defineModule({
	id: 'users',
	name: '$t:user_directory',
	icon: 'people_alt',
	routes: [
		{
			name: 'users-collection',
			path: '',
			component: Collection,
			props: (route) => ({ ...route.params, bookmark: route.query.bookmark }),
		},
		{
			name: 'users-item',
			path: ':primaryKey',
			component: Item,
			props: (route) => ({ ...route.params, bookmark: route.query.bookmark }),
			beforeEnter: checkForSystem,
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
