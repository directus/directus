import { defineModule } from '@directus/shared/utils';
import Collection from './routes/collection.vue';
import Item from './routes/item.vue';

export default defineModule({
	id: 'organisms',
	name: '$t:organisms_directory',
	icon: 'business',
	routes: [
		{
			name: 'organisms-collection',
			path: '',
			component: Collection,
		},
		{
			name: 'organisms-item',
			path: ':primaryKey',
			component: Item,
			props: true,
		},
	],
	order: 11,
	preRegisterCheck(user, permissions) {
		const admin = user.role.admin_access;
		if (admin) return true;

		const permission = permissions.find(
			(permission) => permission.collection === 'directus_organisms' && permission.action === 'read'
		);

		return !!permission;
	},
});
