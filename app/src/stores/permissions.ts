import api from '@/api';
import { Permission } from '@directus/shared/types';
import { parseFilter } from '@/utils/parse-filter';
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

			const response = await api.get('/users/me/permissions');

			this.permissions = response.data.data.map((rawPermission: any) => {
				if (rawPermission.permissions) {
					rawPermission.permissions = parseFilter(rawPermission.permissions);
				}

				if (rawPermission.validation) {
					rawPermission.validation = parseFilter(rawPermission.validation);
				}

				if (rawPermission.presets) {
					rawPermission.presets = parseFilter(rawPermission.presets);
				}

				return rawPermission;
			});
		},
		dehydrate() {
			this.$reset();
		},
	},
});
