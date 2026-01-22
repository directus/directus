import type { PrimaryKey } from '@directus/types';
import { getEndpoint } from '@directus/utils';
import { computed } from 'vue';
import { z } from 'zod';
import { defineTool } from '@/ai/composables/define-tool';
import { useAiContextStore, type VisualElementUpdate } from '@/ai/stores/use-ai-context';
import { isVisualElement } from '@/ai/types';
import api from '@/api';

export function useVisualAiTools() {
	const contextStore = useAiContextStore();

	const visualElements = computed(() => contextStore.pendingContext.filter(isVisualElement).map((item) => item.data));

	const hasElements = computed(() => visualElements.value.length > 0);

	const buildElementDetails = () => {
		return visualElements.value.map((el) => {
			const fields = el.fields?.length ? el.fields.join(', ') : 'all';
			return `${el.collection} (${fields})`;
		});
	};

	// Read tool - fetches current values for all selected elements
	defineTool({
		name: 'read-visual-elements',
		displayName: 'Read Visual Elements',
		description: computed(() => {
			if (!hasElements.value) return 'No visual elements selected';
			return `Read visual elements: ${buildElementDetails().join('; ')}`;
		}),
		inputSchema: z.object({}),
		execute: async () => {
			const elements = contextStore.pendingContext.filter(isVisualElement).map((item) => item.data);

			if (elements.length === 0) {
				return { error: 'No visual elements selected' };
			}

			const results: Array<{
				collection: string;
				item: PrimaryKey;
				fields: string[];
				values: Record<string, unknown>;
			}> = [];

			for (const element of elements) {
				try {
					const fields = element.fields?.length ? element.fields : ['*'];

					const response = await api.get(`${getEndpoint(element.collection)}/${element.item}`, {
						params: { fields },
					});

					results.push({
						collection: element.collection,
						item: element.item,
						fields: element.fields || [],
						values: response.data.data,
					});
				} catch (error) {
					results.push({
						collection: element.collection,
						item: element.item,
						fields: element.fields || [],
						values: { error: error instanceof Error ? error.message : 'Failed to fetch' },
					});
				}
			}

			return results;
		},
	});

	// Update tool - updates selected elements
	defineTool({
		name: 'update-visual-elements',
		displayName: 'Update Visual Elements',
		description: computed(() => {
			if (!hasElements.value) return 'No visual elements selected';
			return `Update visual elements: ${buildElementDetails().join('; ')}`;
		}),
		inputSchema: z.object({
			updates: z.array(
				z.object({
					collection: z.string().describe('Collection name'),
					item: z.union([z.string(), z.number()]).describe('Item primary key'),
					data: z.record(z.string(), z.unknown()).describe('Fields to update'),
				}),
			),
		}),
		execute: async ({ updates }) => {
			// Access store directly - computed closure may not work in async callback
			const elements = contextStore.pendingContext.filter(isVisualElement).map((item) => item.data);

			const results: VisualElementUpdate[] = [];

			for (const update of updates) {
				// Validate element is in selected list
				const isSelected = elements.some(
					(el) => el.collection === update.collection && String(el.item) === String(update.item),
				);

				if (!isSelected) {
					results.push({
						collection: update.collection,
						item: update.item,
						status: 'error',
						error: 'Element not in selected list',
					});

					continue;
				}

				try {
					await api.patch(`${getEndpoint(update.collection)}/${update.item}`, update.data);

					results.push({
						collection: update.collection,
						item: update.item,
						status: 'success',
					});
				} catch (e) {
					results.push({
						collection: update.collection,
						item: update.item,
						status: 'error',
						error: e instanceof Error ? e.message : 'Update failed',
					});
				}
			}

			// Trigger visual elements updated hook for successful updates
			const successfulUpdates = results.filter((r) => r.status === 'success');

			if (successfulUpdates.length > 0) {
				contextStore.triggerVisualElementsUpdated(results);
			}

			return { success: results.every((r) => r.status === 'success'), updatedElements: results };
		},
	});
}
