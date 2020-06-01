import { createStore } from 'pinia';
import useUserStore from '@/stores/user';
import api from '@/api';
import useProjectsStore from '@/stores/projects';

import { Permission } from './types';

const defaultAdminPermission: Partial<Permission> = {
	role: 1,
	create: 'full',
	read: 'full',
	update: 'full',
	delete: 'full',
	comment: 'full',
	explain: 'none',
	read_field_blacklist: [],
	write_field_blacklist: [],
	status_blacklist: [],
};

const defaultPermission: Partial<Permission> = {
	create: 'none',
	read: 'none',
	update: 'none',
	delete: 'none',
	comment: 'none',
	explain: 'none',
	read_field_blacklist: [],
	write_field_blacklist: [],
	status_blacklist: [],
};

export const usePermissionsStore = createStore({
	id: 'permissionsStore',
	state: () => ({
		permissions: [] as Permission[],
	}),
	actions: {
		getPermissionsForCollection(collection: string) {
			const userStore = useUserStore();

			if (userStore.isAdmin.value) return defaultAdminPermission;

			const permissions = this.state.permissions.filter((permission) => permission.collection === collection);

			return permissions ? permissions : defaultPermission;
		},
		async hydrate() {
			const projectsStore = useProjectsStore();
			const userStore = useUserStore();

			if (userStore.isAdmin.value) return;

			const currentProjectKey = projectsStore.state.currentProjectKey;

			const permissionsResponse = await api.get(`/${currentProjectKey}/permissions`);

			this.state.permissions = permissionsResponse.data.data;
		},
		async dehydrate() {
			this.reset();
		},
	},
});
