import { createStore } from 'pinia';
import api from '@/api';
import { useLatencyStore } from '@/stores';

import { User } from '@/types';

export const useUserStore = createStore({
	id: 'userStore',
	state: () => ({
		currentUser: null as User | null,
		loading: false,
		error: null,
	}),
	getters: {
		fullName(state) {
			if (state.currentUser === null) return null;
			return state.currentUser.first_name + ' ' + state.currentUser.last_name;
		},
		isAdmin(state) {
			return state.currentUser?.role.admin === true || false;
		},
	},
	actions: {
		async hydrate() {
			this.state.loading = true;

			try {
				const { data } = await api.get(`/users/me`, {
					params: {
						fields: '*,avatar.*,role.*',
					},
				});

				this.state.currentUser = data.data;
			} catch (error) {
				this.state.error = error;
			} finally {
				this.state.loading = false;
			}
		},
		async dehydrate() {
			this.reset();
		},
		async trackPage(page: string) {
			const latencyStore = useLatencyStore();

			const start = performance.now();

			await api.patch(`/users/me/track/page`, {
				last_page: page,
			});

			const end = performance.now();

			latencyStore.save({
				timestamp: new Date(),
				latency: end - start,
			});

			if (this.state.currentUser) {
				this.state.currentUser.last_page = page;
			}
		},
	},
});
