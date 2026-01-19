import { defineModule } from '@directus/extensions';
import DeploymentOverview from './routes/overview.vue';
import DeploymentProvider from './routes/provider.vue';
import DeploymentRuns from './routes/runs.vue';

export default defineModule({
	id: 'deployment',
	name: '$t:deployment',
	icon: 'rocket_launch',
	routes: [
		{
			name: 'deployment-overview',
			path: '',
			component: DeploymentOverview,
		},
		{
			name: 'deployment-provider',
			path: ':provider',
			component: DeploymentProvider,
			props: true,
		},
		{
			name: 'deployment-runs',
			path: ':provider/:projectId/runs',
			component: DeploymentRuns,
			props: true,
		},
	],
	preRegisterCheck(user) {
		// Only admin can access deployment module
		return user.admin_access === true;
	},
});

