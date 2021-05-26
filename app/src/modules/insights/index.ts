import { defineModule } from '@/modules/define';
import InsightsOverview from './routes/overview.vue';
import InsightsDashboard from './routes/dashboard.vue';
import InsightsPanelConfiguration from './routes/panel-configuration.vue';

export default defineModule({
	id: 'insights',
	name: '$t:insights',
	icon: 'dashboard',
	routes: [
		{
			name: 'insights-overview',
			path: '/',
			component: InsightsOverview,
		},
		{
			name: 'insights-dashboard',
			path: '/:primaryKey',
			component: InsightsDashboard,
			props: true,
			children: [
				{
					name: 'panel-detail',
					path: ':panelKey',
					props: true,
					components: {
						detail: InsightsPanelConfiguration,
					},
				},
			],
		},
	],
	order: 30,
	preRegisterCheck(user, permissions) {
		const admin = user.role.admin_access;

		if (admin) return true;

		const permission = permissions.find(
			(permission) => permission.collection === 'directus_dashboards' && permission.action === 'read'
		);

		return !!permission;
	},
});
