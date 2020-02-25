import { ModuleConfig } from '@/types/extensions';
import Users from './users.vue';

const config: ModuleConfig = {
	id: 'users',
	icon: 'people',
	name: i18n => i18n.t('collections.directus_users'),
	routes: [
		{
			path: '/',
			component: Users
		}
	]
};

export default config;
