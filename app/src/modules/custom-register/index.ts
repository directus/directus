import { defineModule } from '@directus/utils';
import CustomRegister from './routes/custom-register.vue';

export default defineModule({
	id: 'custom-register',
	name: 'Custom Register',
	icon: 'folder',
	meta: {
		public: true,
	},
	routes: [
		{
			name: 'test',
			path: 'test',
			component: CustomRegister,
			children: [],
			meta: {
				public: true,
			},
		},
	],
	preRegisterCheck(user, permissions) {
		return true
	},
});
