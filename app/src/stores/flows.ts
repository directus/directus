import type { FlowRaw } from '@directus/types';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAiToolsStore } from '@/ai/stores/use-ai-tools';
import { usePermissionsStore } from '@/stores/permissions';
import { fetchAll } from '@/utils/fetch-all';

export const useFlowsStore = defineStore('flowsStore', () => {
	const toolsStore = useAiToolsStore();

	toolsStore.onSystemToolResult(async (toolName) => {
		if (toolName === 'flows') {
			await hydrate();
		}
	});

	const flows = ref<FlowRaw[]>([]);

	return {
		flows,
		hydrate,
		dehydrate,
		getManualFlowsForCollection,
	};

	async function hydrate() {
		const { hasPermission } = usePermissionsStore();

		if (!hasPermission('directus_flows', 'read')) {
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
			(flow) =>
				flow.trigger === 'manual' && flow.status === 'active' && flow.options?.collections?.includes(collection),
		);
	}
});
