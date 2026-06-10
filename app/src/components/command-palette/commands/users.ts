import type { CommandActionContext, CommandConfig } from '../composables/use-command-registry';
import { defineCommands } from '../composables/use-command-registry';
import SearchCollection from './search/search-collection.vue';
import { i18n } from '@/lang';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';

export const usersCommands = defineCommands({
	groups: () => {
		if (!canReadUsers()) return [];

		return [
			{
				id: 'collection:directus_users',
				name: 'Users',
			},
		];
	},
	commands({ route }): CommandConfig[] {
		const t = i18n.global.t;
		const isAdmin = isUserAdmin();

		if (!canReadUsers()) return [];

		const currentPath = route.path;

		return [
			currentPath !== '/users'
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
			{
				id: 'search-users',
				name: t('command_search_users'),
				icon: 'search',
				group: 'collection:directus_users',
				keywords: ['search', 'find', 'people'],
				priority: 40,
				component: SearchCollection,
				props: {
					collection: 'directus_users',
					collectionName: t('user_directory'),
					collectionIcon: 'people_alt',
					displayTemplate: '{{first_name}} {{last_name}} {{email}}',
				},
			},
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

function canReadUsers() {
	return isUserAdmin() || usePermissionsStore().hasPermission('directus_users', 'read');
}

function isUserAdmin() {
	return useUserStore().currentUser?.admin_access ?? false;
}
