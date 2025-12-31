import api from '@/api';
import { useAiStore } from '@/ai/stores/use-ai';
import { usePermissionsStore } from '@/stores/permissions';
import { fetchAll } from '@/utils/fetch-all';
import { flattenGroupedItems } from '@/utils/flatten-grouped-items';
import { unexpectedError } from '@/utils/unexpected-error';
import type { FlowRaw } from '@directus/types';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useFlowsStore = defineStore('flowsStore', () => {
	const aiStore = useAiStore();

	aiStore.onSystemToolResult(async (toolName) => {
		if (toolName === 'flows') {
			await hydrate();
		}
	});

	const flows = ref<FlowRaw[]>([]);

	const sortedFlows = computed(() =>
		flattenGroupedItems(flows.value, {
			getId: (flow) => flow.id,
			getParent: (flow) => flow.group ?? null,
			getSort: (flow) => flow.sort ?? null,
			getName: (flow) => flow.name ?? '',
		}),
	);

	const folders = computed(() => flows.value.filter((flow) => flow.trigger === null));

	return {
		flows,
		sortedFlows,
		folders,
		hydrate,
		dehydrate,
		getManualFlowsForCollection,
		createFlow,
		updateFlow,
		deleteFlow,
		createFolder,
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

	async function createFlow(data: Partial<FlowRaw>): Promise<string> {
		try {
			// Calculate sort value to place new flow at the end of its group
			const targetGroup = data.group ?? null;
			const siblings = flows.value.filter((flow) => (flow.group ?? null) === targetGroup);
			const maxSort = Math.max(0, ...siblings.map((flow) => flow.sort ?? 0));

			const response = await api.post('/flows', {
				...data,
				sort: maxSort + 1,
			});

			await hydrate();

			return response.data.data.id;
		} catch (error) {
			unexpectedError(error);
			throw error;
		}
	}

	async function updateFlow(id: string, updates: Partial<FlowRaw>) {
		try {
			await api.patch(`/flows/${id}`, updates);

			// Optimistic update
			flows.value = flows.value.map((flow) => (flow.id === id ? { ...flow, ...updates } : flow));
		} catch (error) {
			unexpectedError(error);
			throw error;
		}
	}

	async function deleteFlow(id: string) {
		try {
			// Move children to root before deleting
			const children = flows.value.filter((flow) => flow.group === id);

			if (children.length > 0) {
				await api.patch(
					'/flows',
					children.map((child) => ({ id: child.id, group: null })),
				);
			}

			await api.delete(`/flows/${id}`);

			// Update local state
			flows.value = flows.value
				.map((flow) => (flow.group === id ? { ...flow, group: null } : flow))
				.filter((flow) => flow.id !== id);
		} catch (error) {
			unexpectedError(error);
			throw error;
		}
	}

	async function createFolder(data: {
		name: string;
		icon?: string;
		color?: string;
		description?: string;
		group?: string | null;
	}) {
		try {
			// Calculate sort value to place new folder at the end of its group
			const siblings = flows.value.filter((flow) => (flow.group ?? null) === (data.group ?? null));
			const maxSort = Math.max(0, ...siblings.map((flow) => flow.sort ?? 0));

			const response = await api.post('/flows', {
				...data,
				trigger: null,
				status: 'inactive',
				collapse: 'open',
				sort: maxSort + 1,
			});

			await hydrate();

			return response.data.data;
		} catch (error) {
			unexpectedError(error);
			throw error;
		}
	}
});
