import { FlowRaw } from '@directus/shared/types';
import api from '@/api';
import { defineStore } from 'pinia';
import { useUserStore, usePermissionsStore } from '@/stores';

export const useFlowsStore = defineStore({
	id: 'flowsStore',
	state: () => ({
		flows: [] as FlowRaw[],
	}),
	actions: {
		async hydrate() {
			const userStore = useUserStore();
			const permissionsStore = usePermissionsStore();

			if (userStore.isAdmin !== true && !permissionsStore.hasPermission('directus_dashboards', 'read')) {
				this.flows = [];
			} else {
				try {
					const response = await api.get<any>('/flows', {
						params: { limit: -1, fields: ['*', 'operations.*'] },
					});

					this.flows = response.data.data;
				} catch {
					this.flows = [];
				}
			}
		},
		async dehydrate() {
			this.$reset();
		},
	},
});
