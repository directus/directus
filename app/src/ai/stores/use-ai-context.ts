import type { ContextAttachment, VisualElementContextData } from '@directus/ai';
import { getEndpoint } from '@directus/utils';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { isItemContext, isPromptContext, isVisualElement, type PendingContextItem } from '../types';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';

export const MAX_PENDING_CONTEXT = 10;

export const useAiContextStore = defineStore('ai-context-store', () => {
	const pendingContext = ref<PendingContextItem[]>([]);

	const visualElementContextUrl = ref<string | null>(null);

	const visualElements = computed(() => pendingContext.value.filter(isVisualElement));

	const hasVisualElementContext = computed(() => visualElements.value.length > 0);

	const hasPendingContext = computed(() => pendingContext.value.length > 0);

	const addPendingContext = (item: PendingContextItem): boolean => {
		// Enforce max limit for visual elements
		if (isVisualElement(item) && visualElements.value.length >= MAX_PENDING_CONTEXT) {
			return false;
		}

		pendingContext.value = [...pendingContext.value, item];
		return true;
	};

	const removePendingContext = (id: string) => {
		pendingContext.value = pendingContext.value.filter((item) => item.id !== id);
	};

	const updateVisualElementContext = (id: string, data: VisualElementContextData, display: string) => {
		pendingContext.value = pendingContext.value.map((item) => {
			if (item.id !== id || !isVisualElement(item)) return item;
			return { ...item, data, display };
		});
	};

	const clearPendingContext = () => {
		pendingContext.value = [];
	};

	/**
	 * Clear only non-visual-element context (prompts, items).
	 * Visual elements persist until user navigates away from visual editor.
	 */
	const clearNonVisualContext = () => {
		pendingContext.value = pendingContext.value.filter(isVisualElement);
	};

	const clearVisualElementContext = () => {
		pendingContext.value = pendingContext.value.filter((item) => !isVisualElement(item));
		visualElementContextUrl.value = null;
	};

	const setVisualElementContextUrl = (url: string) => {
		// If URL changes, clear existing visual element context
		if (visualElementContextUrl.value !== null && visualElementContextUrl.value !== url) {
			clearVisualElementContext();
		}

		visualElementContextUrl.value = url;
	};

	/**
	 * Snapshot all pending context items, fetching current values for visual elements
	 */
	const snapshotContext = async (): Promise<ContextAttachment[]> => {
		const attachments: ContextAttachment[] = [];

		for (const item of pendingContext.value) {
			if (isVisualElement(item)) {
				// Fetch current values from API
				try {
					const fields = item.data.fields?.length ? item.data.fields : ['*'];

					const response = await api.get(`${getEndpoint(item.data.collection)}/${item.data.item}`, {
						params: { fields },
					});

					attachments.push({
						type: 'visual-element',
						data: item.data,
						display: item.display,
						snapshot: response.data.data,
					});
				} catch (error) {
					unexpectedError(error);
					// Skip failed items - don't include in attachments
					continue;
				}
			} else if (isItemContext(item)) {
				attachments.push({
					type: 'item',
					data: item.data,
					display: item.display,
					snapshot: item.data.itemData,
				});
			} else if (isPromptContext(item)) {
				attachments.push({
					type: 'prompt',
					data: item.data,
					display: item.display,
					snapshot: { text: item.data.text },
				});
			}
		}

		return attachments;
	};

	const dehydrate = () => {
		pendingContext.value = [];
		visualElementContextUrl.value = null;
	};

	return {
		// State
		pendingContext,
		visualElementContextUrl,

		// Computed
		visualElements,
		hasVisualElementContext,
		hasPendingContext,

		// Actions
		addPendingContext,
		removePendingContext,
		updateVisualElementContext,
		clearPendingContext,
		clearNonVisualContext,
		clearVisualElementContext,
		setVisualElementContextUrl,
		snapshotContext,
		dehydrate,
	};
});
