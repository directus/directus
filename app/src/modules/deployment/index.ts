import { defineModule } from '@directus/extensions';
import DeploymentOverview from './routes/overview.vue';
import DeploymentProviderDashboard from './routes/provider/dashboard.vue';
import DeploymentProviderRun from './routes/provider/run.vue';
import DeploymentProviderRuns from './routes/provider/runs.vue';
import DeploymentProviderSettings from './routes/provider/settings.vue';

export default defineModule({
	id: 'deployments',
	name: '$t:deployment.deployment',
	icon: 'rocket_launch',
	routes: [
		{
			name: 'deployments-overview',
			path: '',
			component: DeploymentOverview,
		},
		{
			name: 'deployments-provider-dashboard',
			path: ':provider',
			component: DeploymentProviderDashboard,
			props: true,
		},
		{
			name: 'deployments-provider-settings',
			path: ':provider/settings',
			component: DeploymentProviderSettings,
			props: true,
		},
		{
			name: 'deployments-provider-runs',
			path: ':provider/:projectId/runs',
			component: DeploymentProviderRuns,
			props: true,
		},
		{
			name: 'deployments-provider-run',
			path: ':provider/:projectId/runs/:runId',
			component: DeploymentProviderRun,
			props: true,
		},
	],
	preRegisterCheck(user) {
		return user.admin_access === true;
	},
});
