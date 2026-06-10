import type { CommandActionContext, CommandConfig } from '../composables/use-command-registry';
import { defineCommands, refreshRegisteredCommands } from '../composables/use-command-registry';
import { MODULE_BAR_DEFAULT } from '@/constants';
import { useExtensions } from '@/extensions';
import { i18n } from '@/lang';
import { useDeploymentNavigation } from '@/modules/deployment/composables/use-deployment-navigation';
import { usePermissionsStore } from '@/stores/permissions';
import { useSettingsStore } from '@/stores/settings';
import { useUserStore } from '@/stores/user';

const group = 'module:deployments';

export const deploymentsCommands = defineCommands({
	groups: () => {
		if (!isDeploymentsEnabled() || !usePermissionsStore().hasPermission('directus_deployments', 'read')) return [];

		return [
			{
				id: group,
				name: i18n.global.t('deployment.deployment'),
				icon: 'rocket_launch',
			},
		];
	},
	commands(): CommandConfig[] {
		const permissionsStore = usePermissionsStore();

		if (!isDeploymentsEnabled() || !permissionsStore.hasPermission('directus_deployments', 'read')) return [];

		const userStore = useUserStore();
		const isAdmin = userStore.isAdmin;
		const canReadRuns = permissionsStore.hasPermission('directus_deployment_runs', 'read');
		const canManageSettings = canManageDeploymentSettings();
		const { providers, fetch } = useDeploymentNavigation();
		const t = i18n.global.t;

		if (providers.value.length === 0) {
			void fetch().then(() => {
				if (providers.value.length > 0) refreshRegisteredCommands();
			});
		}

		const visibleProviders = isAdmin
			? providers.value
			: providers.value.filter((provider) => (provider.projects?.length ?? 0) > 0 && canReadRuns);

		return [
			{
				id: 'view-deployments',
				name: t('command_go_to_deployments'),
				icon: 'rocket_launch',
				group,
				keywords: ['deployments', 'deploy'],
				priority: 30,
				action: ({ router }: CommandActionContext) => {
					router.push('/deployments');
				},
			},
			...visibleProviders.map((provider) => {
				const hasProjects = (provider.projects?.length ?? 0) > 0;
				const providerName = t(`deployment.provider.${provider.provider}.name`);

				return {
					id: `view-deployments-provider:${provider.provider}`,
					name: t('command_go_to_deployment_provider', { provider: providerName }),
					icon: provider.provider,
					group,
					keywords: ['deployments', 'deploy', providerName],
					priority: 25,
					action: ({ router }: CommandActionContext) => {
						router.push({
							name: !hasProjects && isAdmin ? 'deployments-provider-settings' : 'deployments-provider-dashboard',
							params: { provider: provider.provider },
						});
					},
				};
			}),
			...(canReadRuns
				? visibleProviders.flatMap((provider) =>
						(provider.projects ?? []).map((project) => {
							const providerName = t(`deployment.provider.${provider.provider}.name`);

							return {
								id: `view-deployments-project:${provider.provider}:${project.id}`,
								name: t('command_go_to_deployment_project', { project: project.name }),
								icon: provider.provider,
								group,
								keywords: ['deployments', 'deploy', providerName, project.name],
								priority: 20,
								action: ({ router }: CommandActionContext) => {
									router.push({
										name: 'deployments-provider-runs',
										params: { provider: provider.provider, projectId: project.id },
									});
								},
							};
						}),
					)
				: []),
			...(canManageSettings
				? visibleProviders.map((provider) => {
						const providerName = t(`deployment.provider.${provider.provider}.name`);

						return {
							id: `deployment-settings:${provider.provider}`,
							name: t('command_deployment_provider_settings', { provider: providerName }),
							icon: 'settings',
							group,
							keywords: ['deployments', 'settings', providerName],
							priority: 15,
							action: ({ router }: CommandActionContext) => {
								router.push({
									name: 'deployments-provider-settings',
									params: { provider: provider.provider },
								});
							},
						};
					})
				: []),
		];
	},
});

function isDeploymentsEnabled() {
	const settingsStore = useSettingsStore();
	const { modules } = useExtensions();

	if (!modules.value.some((module) => module.id === 'deployments')) return false;

	const moduleBar = settingsStore.settings?.module_bar ?? MODULE_BAR_DEFAULT;
	const deploymentsModule = moduleBar.find(
		(modulePart) => modulePart.type === 'module' && modulePart.id === 'deployments',
	);

	return deploymentsModule?.enabled === true;
}

function canManageDeploymentSettings() {
	const permissionsStore = usePermissionsStore();

	return (
		permissionsStore.hasPermission('directus_deployments', 'update') ||
		permissionsStore.hasPermission('directus_deployments', 'delete') ||
		permissionsStore.hasPermission('directus_deployment_projects', 'create') ||
		permissionsStore.hasPermission('directus_deployment_projects', 'delete')
	);
}
