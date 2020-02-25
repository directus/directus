import { ModuleConfig } from '@/types/extensions';
import Collections from './collections.vue';

const config: ModuleConfig = {
	id: 'collections',
	icon: 'box',
	name: i18n => i18n.tc('collection', 2),
	routes: [
		{
			path: '/',
			component: Collections
		}
	]
};

export default config;
