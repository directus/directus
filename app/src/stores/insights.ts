import { Dashboard } from '../types';
import api from '@/api';
import { defineStore } from 'pinia';
import { useUserStore } from '@/stores';
import { isAllowed } from '../utils/is-allowed';

export const useInsightsStore = defineStore({
	id: 'insightsStore',
	state: () => ({
		dashboards: [] as Dashboard[],
	}),
	actions: {
		async hydrate() {
			const userStore = useUserStore();

			if (userStore.isAdmin !== true && !isAllowed('directus_dashboards', 'read', null)) {
				this.dashboards = [];
			} else {
				try {
					const response = await api.get('/dashboards', {
						params: { limit: -1, fields: ['*', 'panels.*'], sort: ['name'] },
					});

					this.dashboards = response.data.data;
				} catch {
					this.dashboards = [];
				}
			}
		},
		async dehydrate() {
			this.$reset();
		},
	},
});
