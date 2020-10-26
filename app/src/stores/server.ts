import { createStore } from 'pinia';
import api from '@/api';

export const useServerStore = createStore({
	id: 'serverStore',
	state: () => ({
		info: null,
	}),
	actions: {
		async hydrate() {
			const response = await api.get(`/server/info`);
			this.state.info = response.data.data;
		},
		dehydrate() {
			this.reset();
		},
	},
});
