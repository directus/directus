import { defineModule } from '@directus/extensions';
import DeploymentOverview from './routes/overview.vue';
import DeploymentProviderDashboard from './routes/provider/dashboard.vue';
import DeploymentProviderSettings from './routes/provider/settings.vue';
import DeploymentProviderRuns from './routes/provider/runs.vue';
import DeploymentProviderRun from './routes/provider/run.vue';

export default defineModule({
	id: 'deployment',
	name: '$t:deployment.deployment',
	icon: 'rocket_launch',
	routes: [
		{
			name: 'deployment-overview',
			path: '',
			component: DeploymentOverview,
		},
		{
			name: 'deployment-provider-dashboard',
			path: ':provider',
			component: DeploymentProviderDashboard,
			props: true,
		},
		{
			name: 'deployment-provider-settings',
			path: ':provider/settings',
			component: DeploymentProviderSettings,
			props: true,
		},
		{
			name: 'deployment-provider-runs',
			path: ':provider/:projectId/runs',
			component: DeploymentProviderRuns,
			props: true,
		},
		{
			name: 'deployment-provider-run',
			path: ':provider/:projectId/runs/:runId',
			component: DeploymentProviderRun,
			props: true,
		},
	],
	preRegisterCheck(user) {
		return user.admin_access === true;
	},
});
