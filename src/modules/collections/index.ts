import { ModuleConfig } from '@/modules/types';
import Collections from './collections.vue';

const config: ModuleConfig = {
	id: 'collections',
	routes: [
		{
			path: '/',
			component: Collections
		}
	]
};

export default config;
