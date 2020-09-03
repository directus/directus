import { createStore } from 'pinia';
import api from '@/api';
import { Permission } from '@/types';

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
	},
});
