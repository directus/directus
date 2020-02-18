import { ModuleConfig } from '@/modules/types';
import Files from './files.vue';

const config: ModuleConfig = {
	id: 'files',
	routes: [
		{
			path: '/',
			component: Files
		}
	]
};

export default config;
