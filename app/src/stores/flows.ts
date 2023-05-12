import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { fetchAll } from '@/utils/fetch-all';
import { FlowRaw } from '@directus/types';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useFlowsStore = defineStore('flowsStore', () => {
	const flows = ref<FlowRaw[]>([]);

	return {
		flows,
		hydrate,
		dehydrate,
		getManualFlowsForCollection,
	};

	async function hydrate() {
		const { isAdmin } = useUserStore();
		const { hasPermission } = usePermissionsStore();

		if (isAdmin !== true && !hasPermission('directus_flows', 'read')) {
			flows.value = [];
		} else {
			try {
				flows.value = await fetchAll('/flows', {
					params: { fields: ['*', 'operations.*'] },
				});
			} catch {
				flows.value = [];
			}
		}
	}

	async function dehydrate() {
		flows.value = [];
	}

	function getManualFlowsForCollection(collection: string): FlowRaw[] {
		return flows.value.filter(
			(flow) => flow.trigger === 'manual' && flow.status === 'active' && flow.options?.collections?.includes(collection)
		);
	}
});
