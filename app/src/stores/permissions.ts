import api from '@/api';
import { Permission } from '@directus/shared/types';
import { parseFilter } from '@/utils/parse-filter';
import { defineStore } from 'pinia';
import { useUserStore } from '../stores/user';
import { deepMap } from '@directus/shared/utils';

export const usePermissionsStore = defineStore({
	id: 'permissionsStore',
	state: () => ({
		permissions: [] as Permission[],
	}),
	actions: {
		async hydrate() {
			const userStore = useUserStore();

			const requiredPermissionData = {
				$CURRENT_USER: [] as string[],
				$CURRENT_ROLE: [] as string[],
			};

			const extractPermissionData = (val: any) => {
				if (typeof val === 'string' && val.startsWith('$CURRENT_USER.')) {
					const fieldString = val.replace('$CURRENT_USER.', '');
					if (val && !requiredPermissionData.$CURRENT_USER.includes(fieldString)) {
						requiredPermissionData.$CURRENT_USER.push(fieldString);
					}
				}

				if (typeof val === 'string' && val.startsWith('$CURRENT_ROLE.')) {
					const fieldString = val.replace('$CURRENT_ROLE.', 'role.');
					if (val && !requiredPermissionData.$CURRENT_ROLE.includes(fieldString)) {
						requiredPermissionData.$CURRENT_ROLE.push(fieldString);
					}
				}

				return val;
			};

			const processConditions = (rawPermission: any) => {
				if (rawPermission.permissions) {
					deepMap(rawPermission.permissions, extractPermissionData);
				}
				if (rawPermission.validation) {
					deepMap(rawPermission.validation, extractPermissionData);
				}
				if (rawPermission.presets) {
					deepMap(rawPermission.presets, extractPermissionData);
				}
			};

			const response = await api.get('/permissions', {
				params: { limit: -1, filter: { role: { _eq: userStore.currentUser!.role.id } } },
			});

			this.permissions = response.data.data;

			this.permissions.map((rawPermission: any) => processConditions(rawPermission));

			await userStore.updateFilterContext(requiredPermissionData);

			this.permissions = this.permissions.map((rawPermission: any) => {
				if (rawPermission.permissions) {
					rawPermission.permissions = parseFilter(rawPermission.permissions, userStore.cachedFilterContext);
				}

				if (rawPermission.validation) {
					rawPermission.validation = parseFilter(rawPermission.validation, userStore.cachedFilterContext);
				}

				if (rawPermission.presets) {
					rawPermission.presets = parseFilter(rawPermission.presets, userStore.cachedFilterContext);
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
