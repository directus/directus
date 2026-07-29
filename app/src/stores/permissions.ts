import { CollectionAccess, PermissionsAction } from '@directus/types';
import { defineStore } from 'pinia';
import { useUserStore } from '../stores/user';
import api from '@/api';

export const usePermissionsStore = defineStore({
	id: 'permissionsStore',
	state: () => ({
		permissions: {} as CollectionAccess,
	}),
	actions: {
		async hydrate() {
			const response = await api.get('/permissions/me');
			this.permissions = response.data.data as CollectionAccess;
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
