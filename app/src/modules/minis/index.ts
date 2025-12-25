import { defineModule } from '@directus/extensions';
import AppOverview from './routes/overview.vue';
import ShellView from './routes/shell.vue';

export default defineModule({
	id: 'minis',
	name: 'Minis',
	icon: 'apps',
	routes: [
		{
			name: 'minis-overview',
			path: '',
			component: AppOverview,
		},
		{
			name: 'minis-shell',
			path: ':appId',
			component: ShellView,
			props: true,
		},
	],
	preRegisterCheck(user, permissions) {
		const admin = user.admin_access;

		if (admin) return true;

		const access = permissions['directus_minis']?.['read']?.access;
		return access === 'partial' || access === 'full';
	},
});
