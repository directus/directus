import api from '@/api';
import { defineStore } from 'pinia';
import { ServerInfo } from '@directus/shared/types';

export const useServerStore = defineStore({
	id: 'serverStore',
	state: () => ({
		info: null as null | ServerInfo,
	}),
	actions: {
		async hydrate() {
			const response = await api.get(`/server/info`, { params: { limit: -1 } });
			this.info = response.data.data;
		},
		dehydrate() {
			this.$reset();
		},
	},
});
