import { createStore } from 'pinia';
import api from '@/api';
import { Permission } from '@/types';
import { useUserStore } from '../stores/user';
import { parseFilter } from '@/utils/parse-filter';

export const usePermissionsStore = createStore({
	id: 'permissionsStore',
	state: () => ({
		permissions: [] as Permission[],
	}),
	actions: {
		async hydrate() {
			const response = await api.get('/permissions/me', { params: { limit: -1 } });

			this.state.permissions = response.data.data.map((rawPermission: any) => {
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
			this.reset();
		},
		getPermissionsForUser(collection: string, action: Permission['action']) {
			const userStore = useUserStore();
			return (
				this.state.permissions.find(
					(permission) =>
						permission.action === action &&
						permission.collection === collection &&
						permission.role === userStore.state.currentUser?.role?.id
				) || null
			);
		},
	},
});
