import type { CommandActionContext, CommandConfig } from '../composables/use-command-registry';
import { defineCommands } from '../composables/use-command-registry';
import SearchCollection from './search/search-collection.vue';
import { i18n } from '@/lang';
import { useInsightsStore } from '@/stores/insights';
import { usePermissionsStore } from '@/stores/permissions';

const group = 'collection:directus_dashboards';

export const insightsCommands = defineCommands({
	groups: () => {
		const permissionsStore = usePermissionsStore();

		if (!permissionsStore.hasPermission('directus_dashboards', 'read')) return [];

		return [
			{
				id: group,
				name: i18n.global.t('insights'),
				icon: 'insights',
			},
		];
	},
	commands: ({ route }): CommandConfig[] => {
		const permissionsStore = usePermissionsStore();
		const insightsStore = useInsightsStore();
		const t = i18n.global.t;

		if (!permissionsStore.hasPermission('directus_dashboards', 'read')) return [];

		return [
			{
				id: 'view-insights',
				name: t('command_go_to_insights'),
				icon: 'insights',
				group,
				keywords: ['dashboards', 'analytics'],
				priority: 30,
				action: ({ router }: CommandActionContext) => {
					router.push('/insights');
				},
			},
			{
				id: 'search-dashboards',
				name: t('command_search_dashboards'),
				icon: 'search',
				group,
				keywords: ['search', 'find', 'insights'],
				priority: route.path.startsWith('/insights') ? 41 : 40,
				component: SearchCollection,
				props: {
					collection: 'directus_dashboards',
					collectionName: t('insights'),
					collectionIcon: 'insights',
					displayTemplate: '{{name}}',
				},
			},
			...insightsStore.dashboards.map((dashboard) => ({
				id: `view-dashboard:${dashboard.id}`,
				name: dashboard.name,
				icon: dashboard.icon,
				group,
				keywords: ['dashboard', 'insights'],
				priority: 25,
				action: ({ router }: CommandActionContext) => {
					router.push(`/insights/${dashboard.id}`);
				},
			})),
		];
	},
});
