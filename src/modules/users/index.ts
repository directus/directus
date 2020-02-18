import { ModuleConfig } from '@/modules/types';
import Users from './users.vue';

const config: ModuleConfig = {
	id: 'users',
	routes: [
		{
			path: '/',
			component: Users
		}
	]
};

export default config;
