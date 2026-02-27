import { defineModule } from '@directus/extensions';
import { useDeploymentNavigation } from './composables/use-deployment-navigation';
import DeploymentOverview from './routes/overview.vue';
import DeploymentProviderDashboard from './routes/provider/dashboard.vue';
import DeploymentProviderRun from './routes/provider/run.vue';
import DeploymentProviderRuns from './routes/provider/runs.vue';
import DeploymentProviderSettings from './routes/provider/settings.vue';

function ensureNavLoaded() {
	return useDeploymentNavigation().fetch();
}

export default defineModule({
	id: 'deployments',
	name: '$t:deployment.deployment',
	icon: 'rocket_launch',
	routes: [
		{
			name: 'deployments-overview',
			path: '',
			component: DeploymentOverview,
			beforeEnter: ensureNavLoaded,
		},
		{
			name: 'deployments-provider-dashboard',
			path: ':provider',
			component: DeploymentProviderDashboard,
			props: true,
			beforeEnter: ensureNavLoaded,
		},
		{
			name: 'deployments-provider-settings',
			path: ':provider/settings',
			component: DeploymentProviderSettings,
			props: true,
			beforeEnter: ensureNavLoaded,
		},
		{
			name: 'deployments-provider-runs',
			path: ':provider/:projectId/runs',
			component: DeploymentProviderRuns,
			props: true,
			beforeEnter: ensureNavLoaded,
		},
		{
			name: 'deployments-provider-run',
			path: ':provider/:projectId/runs/:runId',
			component: DeploymentProviderRun,
			props: true,
			beforeEnter: ensureNavLoaded,
		},
	],
	preRegisterCheck(user, permissions) {
		if (user.admin_access) return true;

		const access = permissions['directus_deployments']?.['read']?.access;

		return access === 'partial' || access === 'full';
	},
});
