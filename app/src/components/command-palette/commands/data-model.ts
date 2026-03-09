import type { CommandActionContext } from '../composables/use-command-registry';
import { i18n } from '@/lang';
import { useUserStore } from '@/stores/user';
import { defineCommands } from '../composables/use-command-registry';

export const dataModelCommands = defineCommands({
	groups: [
		{
			id: 'data-model',
			name: 'Data Model',
		},
	],
	commands: () => {
		const userStore = useUserStore();
		const isAdmin = userStore.currentUser?.admin_access ?? false;

		if (!isAdmin) return [];

		const t = i18n.global.t;

		return [
			{
				id: 'create-collection',
				name: t('command_create_collection'),
				icon: 'add',
				group: 'data-model',
				keywords: ['data', 'model'],
				action: ({ router }: CommandActionContext) => {
					router.push('/settings/data-model/+');
				},
			},
		];
	},
});
