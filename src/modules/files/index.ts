import { ModuleConfig } from '@/types/extensions';
import Files from './files.vue';

const config: ModuleConfig = {
	id: 'files',
	icon: 'collections',
	name: i18n => i18n.t('collections.directus_files'),
	routes: [
		{
			path: '/',
			component: Files
		}
	]
};

export default config;
