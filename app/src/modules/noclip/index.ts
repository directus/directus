import { defineModule } from '@directus/shared/utils';
import Dashboard from './routes/dashboard.vue';
import Interfaces from './routes/interfaces.vue';
import Displays from './routes/displays.vue';

export default defineModule({
	id: 'noclip',
	name: '$t:noclip',
	icon: 'meeting_room',
	routes: [
		{
			name: 'Dashboard',
			path: '',
			component: Dashboard,
		},
		{
			name: 'interfaces',
			path: 'interfaces/:id',
			component: Interfaces,
			props: true
		},
		{
			name: 'displays',
			path: 'displays/:id',
			component: Displays,
			props: true
		},
	],
	preRegisterCheck() {
		return import.meta.env.DEV
	},
});
