import { ModuleConfig } from '@/modules/types';
import Settings from './settings.vue';

const config: ModuleConfig = {
	id: 'settings',
	routes: [
		{
			path: '/',
			component: Settings
		}
	]
};

export default config;
