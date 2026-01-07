import { CollectionAccess, PermissionsAction } from '@directus/types';
import { deepMap } from '@directus/utils';
import { mapValues } from 'lodash';
import { defineStore } from 'pinia';
import { useUserStore } from '../stores/user';
import api from '@/api';
import { CollectionPermission } from '@/types/permissions';
import { parsePreset } from '@/utils/parse-preset';

export const usePermissionsStore = defineStore({
	id: 'permissionsStore',
	state: () => ({
		permissions: {} as CollectionAccess,
	}),
	actions: {
		async hydrate() {
			const userStore = useUserStore();

			const response = await api.get('/permissions/me');

			const fields = getNestedDynamicVariableFields(response.data.data);

			if (fields.length > 0) {
				await userStore.hydrateAdditionalFields(fields);
			}

			this.permissions = mapValues(
				response.data.data as CollectionAccess,
				(collectionPermission: CollectionPermission) => {
					Object.values(collectionPermission).forEach((actionPermission) => {
						if (actionPermission.presets) {
							actionPermission.presets = parsePreset(actionPermission.presets);
						}
					});

					return collectionPermission;
				},
			) as CollectionAccess;

			function getNestedDynamicVariableFields(rawPermissions: Record<string, CollectionPermission>) {
				const fields = new Set<string>();

				const checkDynamicVariable = (value: string) => {
					if (typeof value !== 'string') return;

					if (value.startsWith('$CURRENT_USER.')) {
						fields.add(value.replace('$CURRENT_USER.', ''));
					} else if (value.startsWith('$CURRENT_ROLE.')) {
						fields.add(value.replace('$CURRENT_ROLE.', 'role.'));
					}
				};

				Object.values(rawPermissions).forEach((collectionPermission: CollectionPermission) => {
					Object.values(collectionPermission).forEach((actionPermission) => {
						deepMap(actionPermission.presets, checkDynamicVariable);
					});
				});

				return Array.from(fields);
			}
		},
		dehydrate() {
			this.$reset();
		},
		getPermission(collection: string, action: PermissionsAction) {
			return this.permissions[collection]?.[action] ?? null;
		},
		hasPermission(collection: string, action: PermissionsAction) {
			const userStore = useUserStore();

			if (userStore.isAdmin) return true;

			return (this.getPermission(collection, action)?.access ?? 'none') !== 'none';
		},
	},
});
