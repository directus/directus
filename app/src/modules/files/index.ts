import { defineModule } from '@/modules/define';
import Collection from './routes/collection.vue';
import Item from './routes/item.vue';
import AddNew from './routes/add-new.vue';

export default defineModule({
	id: 'files',
	name: '$t:file_library',
	icon: 'folder',
	routes: [
		{
			name: 'files-collection',
			path: '/',
			component: Collection,
			props: (route) => ({
				queryFilters: route.query,
			}),
			children: [
				{
					path: '+',
					name: 'add-file',
					components: {
						addNew: AddNew,
					},
				},
			],
		},
		{
			path: '/all',
			component: Collection,
			props: () => ({
				special: 'all',
			}),
		},
		{
			path: '/mine',
			component: Collection,
			props: () => ({
				special: 'mine',
			}),
		},
		{
			path: '/recent',
			component: Collection,
			props: () => ({
				special: 'recent',
			}),
		},
		{
			name: 'files-item',
			path: '/:primaryKey',
			component: Item,
			props: true,
		},
	],
	order: 15,
	preRegisterCheck(user, permissions) {
		const admin = user.role.admin_access;
		if (admin) return true;

		const permission = permissions.find(
			(permission) => permission.collection === 'directus_files' && permission.action === 'read'
		);
		return !!permission;
	},
});
