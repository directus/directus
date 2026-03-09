import type { CommandActionContext, CommandConfig } from '../../composables/use-command-registry';
import { i18n } from '@/lang';
import { useServerStore } from '@/stores/server';
import { useUserStore } from '@/stores/user';
import { defineCommands } from '../../composables/use-command-registry';
import DataModelCollections from './data-model-collections.vue';
import SettingsList from './settings-list.vue';

interface SettingsSection {
	id: string;
	nameKey: string;
	icon: string;
	to: string;
	condition?: () => boolean;
}

const sections: SettingsSection[] = [
	{ id: 'flows', nameKey: 'settings_flows', icon: 'bolt', to: '/settings/flows' },
	{ id: 'roles', nameKey: 'settings_roles', icon: 'group', to: '/settings/roles' },
	{ id: 'permissions', nameKey: 'settings_permissions', icon: 'admin_panel_settings', to: '/settings/policies' },
	{ id: 'project', nameKey: 'settings_project', icon: 'tune', to: '/settings/project' },
	{ id: 'appearance', nameKey: 'settings_appearance', icon: 'palette', to: '/settings/appearance' },
	{ id: 'presets', nameKey: 'settings_presets', icon: 'bookmark', to: '/settings/presets' },
	{ id: 'translations', nameKey: 'settings_translations', icon: 'translate', to: '/settings/translations' },
	{
		id: 'ai',
		nameKey: 'settings_ai',
		icon: 'smart_toy',
		to: '/settings/ai',
		condition: () => {
			const serverStore = useServerStore();
			return serverStore.info.ai_enabled || serverStore.info.mcp_enabled;
		},
	},
	{ id: 'marketplace', nameKey: 'marketplace', icon: 'storefront', to: '/settings/marketplace' },
	{ id: 'extensions', nameKey: 'extensions', icon: 'category', to: '/settings/extensions' },
	{
		id: 'system-logs',
		nameKey: 'settings_system_logs',
		icon: 'terminal',
		to: '/settings/system-logs',
		condition: () => {
			const serverStore = useServerStore();
			return !!(serverStore.info.websocket?.logs);
		},
	},
];

export const settingsCommands = defineCommands({
	groups: [
		{
			id: 'settings',
			name: 'Settings',
		},
	],
	commands: () => {
		const userStore = useUserStore();
		const isAdmin = userStore.currentUser?.admin_access ?? false;

		if (!isAdmin) return [];

		const t = i18n.global.t;

		const settingsDrilldown: CommandConfig = {
			id: 'settings',
			name: t('settings'),
			icon: 'settings',
			group: 'settings',
			keywords: ['admin', 'configure', 'project'],
			priority: 15,
			component: SettingsList,
		};

		const dataModelDrilldown: CommandConfig = {
			id: 'settings:data-model',
			name: t('settings_data_model'),
			icon: 'database',
			group: 'settings',
			keywords: ['settings', 'admin', 'collections', 'configure'],
			priority: 10,
			component: DataModelCollections,
		};

		const sectionCommands: CommandConfig[] = sections
			.filter((section) => !section.condition || section.condition())
			.map((section) => ({
				id: `settings:${section.id}`,
				name: t(section.nameKey),
				icon: section.icon,
				group: 'settings',
				keywords: ['settings', 'admin'],
				priority: 5,
				action: ({ router }: CommandActionContext) => {
					router.push(section.to);
				},
			}));

		return [settingsDrilldown, dataModelDrilldown, ...sectionCommands];
	},
});
