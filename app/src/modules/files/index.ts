import { defineModule } from '@directus/extensions';
import AddNew from './routes/add-new.vue';
import Collection from './routes/collection.vue';
import Item from './routes/item.vue';

export default defineModule({
	id: 'files',
	name: '$t:file_library',
	icon: 'folder',
	routes: [
		{
			name: 'files-collection',
			path: '',
			component: Collection,
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
			name: 'files-item',
			path: ':primaryKey',
			component: Item,
			props: true,
		},
		{
			path: 'folders',
			redirect: '/files',
		},
		{
			name: 'folders-collection',
			path: 'folders/:folder',
			component: Collection,
			props: true,
			children: [
				{
					path: '+',
					name: 'add-file-folder',
					components: {
						addNew: AddNew,
					},
				},
			],
		},
		{
			path: 'all',
			component: Collection,
			props: {
				special: 'all',
			},
		},
		{
			path: 'mine',
			component: Collection,
			props: {
				special: 'mine',
			},
		},
		{
			path: 'recent',
			component: Collection,
			props: {
				special: 'recent',
			},
		},
	],
	preRegisterCheck(user, permissions) {
		const admin = user.role.admin_access;
		if (admin) return true;

		const permission = permissions.find(
			(permission) => permission.collection === 'directus_files' && permission.action === 'read',
		);

		return !!permission;
	},
});
