import { ModuleConfig } from '@/types/modules';
import Settings from './settings.vue';

const config: ModuleConfig = {
	id: 'settings',
	icon: 'settings',
	name: i18n => i18n.t('settings'),
	routes: [
		{
			path: '/',
			component: Settings
		}
	]
};

export default config;
