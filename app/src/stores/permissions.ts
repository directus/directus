import { createStore } from 'pinia';
import api from '@/api';

export const usePermissionsStore = createStore({
	id: 'permissionsStore',
	state: () => ({
		permissions: [],
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
