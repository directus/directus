import { defineModule } from '@/modules/define';
import FilesBrowse from './routes/browse/';
import FilesDetail from './routes/detail/';
import FilesAddNew from './routes/add-new/';

export default defineModule(({ i18n }) => ({
	id: 'files',
	name: i18n.t('file_library'),
	icon: 'folder',
	routes: [
		{
			name: 'files-browse',
			path: '/',
			component: FilesBrowse,
			props: (route) => ({
				queryFilters: route.query
			}),
			children: [
				{
					path: '+',
					name: 'add-file',
					components: {
						addNew: FilesAddNew
					},
				}
			]
		},
		{
			name: 'files-detail',
			path: '/:primaryKey',
			component: FilesDetail,
			props: true,
		},
	],
}));
