import { createStore } from 'pinia';
import api from '@/api';
import { Permission } from '@/types';
import { useUserStore } from '../stores/user';

export const usePermissionsStore = createStore({
	id: 'permissionsStore',
	state: () => ({
		permissions: [] as Permission[],
	}),
	actions: {
		async hydrate() {
			const response = await api.get('/permissions/me');
			this.state.permissions = response.data.data;
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
