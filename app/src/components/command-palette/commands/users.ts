import type { CommandActionContext, CommandConfig } from '../composables/use-command-registry';
import { i18n } from '@/lang';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { defineCommands } from '../composables/use-command-registry';

export const usersCommands = defineCommands({
	groups: [
		{
			id: 'collection:directus_users',
			name: 'Users',
		},
	],
	commands({ route }): CommandConfig[] {
		const permissionsStore = usePermissionsStore();
		const userStore = useUserStore();
		const isAdmin = userStore.currentUser?.admin_access ?? false;
		const t = i18n.global.t;

		const hasUserReadPermissions = isAdmin || permissionsStore.hasPermission('directus_users', 'read');

		if (!hasUserReadPermissions) return [];

		const currentPath = route.path;

		return [
			hasUserReadPermissions && currentPath !== '/users'
				? {
						id: 'view-users',
						name: t('command_view_users'),
						icon: 'arrow_right_alt',
						group: 'collection:directus_users',
						action: ({ router }: CommandActionContext) => {
							router.push('/users');
						},
					}
				: null,
			isAdmin
				? {
						id: 'create-user',
						name: t('command_create_user'),
						icon: 'add',
						group: 'collection:directus_users',
						action: ({ router }: CommandActionContext) => {
							router.push('/users/+');
						},
					}
				: null,
		].filter((cmd) => cmd !== null) as CommandConfig[];
	},
});
