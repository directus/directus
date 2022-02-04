import { Dashboard } from '../types';
import api from '@/api';
import { defineStore } from 'pinia';
import { useUserStore, usePermissionsStore } from '@/stores';

export const useInsightsStore = defineStore({
	id: 'insightsStore',
	state: () => ({
		dashboards: [] as Dashboard[],
	}),
	actions: {
		async hydrate() {
			const userStore = useUserStore();
			const permissionsStore = usePermissionsStore();

			if (userStore.isAdmin !== true && !permissionsStore.hasPermission('directus_dashboards', 'read')) {
				this.dashboards = [];
			} else {
				try {
					const response = await api.get<any>('/dashboards', {
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
