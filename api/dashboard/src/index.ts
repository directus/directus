import { defineModule } from '@directus/extensions-sdk';
import ReactionRolesHome from './pages/reaction-roles/index.vue';
import ReactinonRolesItem from './pages/reaction-roles/[id].vue';

export default defineModule({
	id: 'reaction-roles',
	name: 'reaction-roles',
	icon: 'box',
	routes: [
		{
			path: '',
			component: ReactionRolesHome,
		},
		{
			path: 'reaction-roles/:id',
			component: ReactinonRolesItem,
		},
	],
});
