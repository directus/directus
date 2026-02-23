import type { ContextAttachment, PrimaryKey, VisualElementContextData } from '@directus/ai';
import { getEndpoint } from '@directus/utils';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
	isFileContext,
	isItemContext,
	isLocalFileContext,
	isPromptContext,
	isVisualElement,
	type PendingContextItem,
	type ProviderFileRef,
} from '../types';
import api from '@/api';
import { i18n } from '@/lang';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';

export const MAX_PENDING_CONTEXT = 10;

export const useAiContextStore = defineStore('ai-context-store', () => {
	const pendingContext = ref<PendingContextItem[]>([]);
	const createdObjectUrls = new Set<string>();

	const visualElementContextUrl = ref<string | null>(null);

	const visualElements = computed(() => pendingContext.value.filter(isVisualElement));

	const hasVisualElementContext = computed(() => visualElements.value.length > 0);

	const hasPendingContext = computed(() => pendingContext.value.length > 0);

	const hasFileContext = computed(() =>
		pendingContext.value.some((item) => isFileContext(item) || isLocalFileContext(item)),
	);

	const addPendingContext = (item: PendingContextItem): boolean => {
		if (pendingContext.value.length >= MAX_PENDING_CONTEXT) {
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

	/**
	 * Updates the visual element context URL. If the URL has changed,
	 * all existing visual element context is cleared since it belongs
	 * to the previous page.
	 */
	const syncVisualElementContextUrl = (url: string) => {
		if (visualElementContextUrl.value !== null && visualElementContextUrl.value !== url) {
			clearVisualElementContext();
		}

		visualElementContextUrl.value = url;
	};

	const fetchItem = async (collection: string, id: PrimaryKey, fields: string[] = ['*']) => {
		try {
			const response = await api.get(`${getEndpoint(collection)}/${id}`, { params: { fields } });
			return response.data.data;
		} catch (error) {
			unexpectedError(error);
			return null;
		}
	};

	const fetchContextData = async (): Promise<ContextAttachment[]> => {
		const nonFileItems = pendingContext.value.filter((item) => !isFileContext(item) && !isLocalFileContext(item));

		const fetches = nonFileItems.map(async (item): Promise<ContextAttachment | null> => {
			if (isVisualElement(item)) {
				const fields = item.data.fields?.length ? item.data.fields : ['*'];
				const snapshot = await fetchItem(item.data.collection, item.data.item, fields);
				if (!snapshot) return null;
				return { type: 'visual-element', data: item.data, display: item.display, snapshot };
			}

			if (isItemContext(item)) {
				const snapshot = await fetchItem(item.data.collection, item.data.key, ['*']);
				if (!snapshot) return null;
				return { type: 'item', data: item.data, display: item.display, snapshot };
			}

			if (isPromptContext(item)) {
				return {
					type: 'prompt',
					data: item.data,
					display: item.display,
					snapshot: {
						text: item.data.text,
						...(item.data.prompt?.messages ? { messages: item.data.prompt.messages } : {}),
					},
				};
			}

			return null;
		});

		const results = await Promise.all(fetches);

		const failedCount = results.filter((r) => r === null).length;

		if (failedCount > 0) {
			notify({
				title: i18n.global.t('ai.some_context_failed', { count: failedCount }),
				type: 'warning',
			});
		}

		return results.filter((a): a is ContextAttachment => a !== null);
	};

	const uploadFileToProvider = async (file: File, provider: string): Promise<ProviderFileRef> => {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('provider', provider);

		const response = await api.post('/ai/files', formData);
		return response.data;
	};

	interface UploadedFileResult {
		ref: ProviderFileRef;
		display: string;
		displayUrl: string;
		mimeType: string;
	}

	const uploadPendingFiles = async (provider?: string): Promise<UploadedFileResult[]> => {
		if (!provider) return [];

		const fileItems = pendingContext.value.filter((item) => isFileContext(item) || isLocalFileContext(item));

		if (fileItems.length === 0) return [];

		const results: UploadedFileResult[] = [];

		for (const item of fileItems) {
			try {
				let file: File;
				let displayUrl: string;

				if (isLocalFileContext(item)) {
					file = item.data.file;

					if (item.data.thumbnailUrl) {
						displayUrl = item.data.thumbnailUrl;
					} else {
						displayUrl = URL.createObjectURL(file);
						createdObjectUrls.add(displayUrl);
					}
				} else if (isFileContext(item)) {
					const assetResponse = await api.get(`/assets/${item.data.id}`, { responseType: 'blob' });
					file = new File([assetResponse.data], item.data.filename_download, { type: item.data.type });
					displayUrl = `/assets/${item.data.id}`;
				} else {
					continue;
				}

				const ref = await uploadFileToProvider(file, provider);

				results.push({
					ref,
					display: item.display,
					displayUrl,
					mimeType: file.type,
				});
			} catch (error) {
				notify({
					title: i18n.global.t('ai.file_upload_failed', { name: item.display }),
					type: 'warning',
				});
			}
		}

		return results;
	};

	const revokeObjectUrls = () => {
		for (const url of createdObjectUrls) {
			URL.revokeObjectURL(url);
		}

		createdObjectUrls.clear();
	};

	const dehydrate = () => {
		revokeObjectUrls();
		clearPendingContext();
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
		hasFileContext,

		// Actions
		addPendingContext,
		removePendingContext,
		updateVisualElementContext,
		clearPendingContext,
		clearNonVisualContext,
		clearVisualElementContext,
		syncVisualElementContextUrl,
		fetchContextData,
		uploadPendingFiles,
		dehydrate,
	};
});
