import { defineModule } from '@/modules/define';
import FilesBrowse from './routes/browse/';
import FilesDetail from './routes/detail/';

export default defineModule(({ i18n }) => ({
	id: 'files',
	name: i18n.t('files'),
	icon: 'folder',
	routes: [
		{
			name: 'files-browse',
			path: '/',
			component: FilesBrowse,
			props: true,
		},
		{
			name: 'files-detail',
			path: '/:primaryKey',
			component: FilesDetail,
			props: true,
		},
	],
}));
