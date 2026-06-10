import type { CommandActionContext, CommandConfig } from '../composables/use-command-registry';
import { defineCommands } from '../composables/use-command-registry';
import SearchCollection from './search/search-collection.vue';
import { i18n } from '@/lang';
import { usePermissionsStore } from '@/stores/permissions';

const group = 'collection:directus_files';

export const filesCommands = defineCommands({
	groups: () => {
		const permissionsStore = usePermissionsStore();

		if (!permissionsStore.hasPermission('directus_files', 'read')) return [];

		return [
			{
				id: group,
				name: i18n.global.t('file_library'),
				icon: 'folder',
			},
		];
	},
	commands: ({ route }): CommandConfig[] => {
		const permissionsStore = usePermissionsStore();
		const t = i18n.global.t;

		if (!permissionsStore.hasPermission('directus_files', 'read')) return [];

		const commands: CommandConfig[] = [
			{
				id: 'view-files',
				name: t('command_go_to_file_library'),
				icon: 'folder',
				group,
				keywords: ['files', 'library', 'media'],
				priority: 30,
				action: ({ router }: CommandActionContext) => {
					router.push('/files');
				},
			},
			{
				id: 'search-files',
				name: t('command_search_files'),
				icon: 'search',
				group,
				keywords: ['search', 'find', 'media'],
				priority: route.path.startsWith('/files') ? 41 : 40,
				component: SearchCollection,
				props: {
					collection: 'directus_files',
					collectionName: t('file_library'),
					collectionIcon: 'folder',
					displayTemplate: '{{title}}',
				},
			},
			{
				id: 'view-all-files',
				name: t('all_files'),
				icon: 'file_copy',
				group,
				keywords: ['files', 'library'],
				priority: 20,
				action: ({ router }: CommandActionContext) => {
					router.push('/files/all');
				},
			},
			{
				id: 'view-my-files',
				name: t('my_files'),
				icon: 'folder_shared',
				group,
				keywords: ['files', 'mine'],
				priority: 20,
				action: ({ router }: CommandActionContext) => {
					router.push('/files/mine');
				},
			},
			{
				id: 'view-recent-files',
				name: t('recent_files'),
				icon: 'history',
				group,
				keywords: ['files', 'recent'],
				priority: 20,
				action: ({ router }: CommandActionContext) => {
					router.push('/files/recent');
				},
			},
		];

		if (permissionsStore.hasPermission('directus_files', 'create')) {
			commands.push({
				id: 'upload-file',
				name: t('upload_file'),
				icon: 'add',
				group,
				keywords: ['add', 'create', 'files'],
				priority: 20,
				action: ({ router }: CommandActionContext) => {
					router.push('/files/+');
				},
			});
		}

		return commands;
	},
});
