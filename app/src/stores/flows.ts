import { FlowRaw } from '@directus/shared/types';
import api from '@/api';
import { defineStore } from 'pinia';
import { useUserStore } from '@/stores/user';
import { usePermissionsStore } from '@/stores/permissions';

export const useFlowsStore = defineStore({
	id: 'flowsStore',
	state: () => ({
		flows: [] as FlowRaw[],
	}),
	actions: {
		async hydrate() {
			const { isAdmin } = useUserStore();
			const { hasPermission } = usePermissionsStore();

			if (isAdmin !== true && !hasPermission('directus_flows', 'read')) {
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
		getManualFlowsForCollection(collection: string): FlowRaw[] {
			return this.flows.filter(
				(flow) =>
					flow.trigger === 'manual' && flow.status === 'active' && flow.options?.collections?.includes(collection)
			);
		},
	},
});
