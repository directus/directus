import api from '@/api';
import { Permission } from '@directus/shared/types';
import { parseFilter } from '@/utils/parse-filter';
import { parsePreset } from '@/utils/parse-preset';
import { defineStore } from 'pinia';
import { useUserStore } from '../stores/user';

export const usePermissionsStore = defineStore({
	id: 'permissionsStore',
	state: () => ({
		permissions: [] as Permission[],
	}),
	actions: {
		async hydrate() {
			const userStore = useUserStore();

			const response = await api.get('/permissions', {
				params: { limit: -1, filter: { role: { _eq: userStore.currentUser!.role.id } } },
			});

			this.permissions = response.data.data.map((rawPermission: any) => {
				if (rawPermission.permissions) {
					rawPermission.permissions = parseFilter(rawPermission.permissions);
				}

				if (rawPermission.validation) {
					rawPermission.validation = parseFilter(rawPermission.validation);
				}

				if (rawPermission.presets) {
					rawPermission.presets = parsePreset(rawPermission.presets);
				}

				return rawPermission;
			});
		},
		dehydrate() {
			this.$reset();
		},
		getPermissionsForUser(collection: string, action: Permission['action']) {
			const userStore = useUserStore();
			return (
				this.permissions.find(
					(permission) =>
						permission.action === action &&
						permission.collection === collection &&
						permission.role === userStore.currentUser?.role?.id
				) || null
			);
		},
		hasPermission(collection: string, action: Permission['action']) {
			const userStore = useUserStore();
			if (userStore.currentUser?.role?.admin_access === true) return true;
			return !!this.getPermissionsForUser(collection, action);
		},
	},
});
