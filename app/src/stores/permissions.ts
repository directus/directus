import api from '@/api';
import { Permission } from '@directus/types';
import { deepMap } from '@directus/utils';
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
				params: { filter: { role: { _eq: userStore.currentUser!.role.id } } },
			});

			const fields = getNestedDynamicVariableFieldsInPresets(response.data.data);

			if (fields.length > 0) {
				await userStore.hydrateAdditionalFields(fields);
			}

			this.permissions = response.data.data.map((rawPermission: Permission) => {
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

			function getNestedDynamicVariableFieldsInPresets(rawPermissions: Permission[]) {
				const fields: string[] = [];
				const rawPermissionsWithPresets = rawPermissions.filter((rawPermission: Permission) => rawPermission.presets);

				for (const rawPermissions of rawPermissionsWithPresets) {
					deepMap(rawPermissions.presets, (value) => {
						if (typeof value !== 'string') return;

						if (value.startsWith('$CURRENT_USER.')) {
							fields.push(value.replace('$CURRENT_USER.', ''));
						} else if (value.startsWith('$CURRENT_ROLE.')) {
							fields.push(value.replace('$CURRENT_ROLE.', 'role.'));
						}
					});
				}

				return fields;
			}
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
