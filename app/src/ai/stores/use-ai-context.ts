import type { ContextAttachment, PrimaryKey, ProviderFileRef, VisualElementContextData } from '@directus/ai';
import type { Item } from '@directus/types';
import { getEndpoint, type ParentRelation, resolveWriteTarget } from '@directus/utils';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
	isFileContext,
	isItemContext,
	isLocalFileContext,
	isPromptContext,
	isVisualElement,
	type PendingContextItem,
	type UploadedFileResult,
} from '../types';
import api from '@/api';
import { i18n } from '@/lang';
import sdk, { requestEndpoint } from '@/sdk';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { ensureVersionId } from '@/utils/ensure-version-id';
import { extractErrorCode } from '@/utils/extract-error-code';
import { getSchemaOverview } from '@/utils/get-schema-overview';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';

export const MAX_PENDING_CONTEXT = 10;

// Same page, different draft state — not a navigation.
function stripVersionParam(url: string) {
	try {
		const u = new URL(url, window.location.origin);
		u.searchParams.delete('version');
		return u.toString();
	} catch {
		return url;
	}
}

export const useAiContextStore = defineStore('ai-context-store', () => {
	const collectionsStore = useCollectionsStore();
	const fieldsStore = useFieldsStore();
	const relationsStore = useRelationsStore();

	const pendingContext = ref<PendingContextItem[]>([]);

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
		const changed =
			visualElementContextUrl.value !== null &&
			stripVersionParam(visualElementContextUrl.value) !== stripVersionParam(url);

		if (changed) clearVisualElementContext();

		visualElementContextUrl.value = url;
	};

	const fetchItem = async (collection: string, id: PrimaryKey, fields: string[] = ['*'], version?: string) => {
		try {
			return await sdk.request<Item>(
				requestEndpoint(`${getEndpoint(collection)}/${id}`, {
					params: { fields, ...(version ? { version } : {}) },
				}),
			);
		} catch (error) {
			// `GET /items/:c/:k?version=X` returns 403 when no directus_versions row exists for
			// that key — normal state for first-edit drafts. Surface no toast; caller treats as
			// "no draft context yet". Phase 2 will replace this with a published fallback.
			if (version && extractErrorCode(error) === 'FORBIDDEN') return null;

			unexpectedError(error);
			return null;
		}
	};

	const fetchVisualElementSnapshot = async (data: VisualElementContextData, fields: string[]) => {
		if (!data.parent) {
			if (data.version && collectionsStore.getCollection(data.collection)?.meta?.versioning) {
				await ensureVersionId(api, {
					collection: data.collection,
					item: data.item,
					versionKey: data.version,
				});
			}

			return fetchItem(data.collection, data.item, fields, data.version);
		}

		const target = await resolveWriteTarget({
			schema: getSchemaOverview({
				collections: collectionsStore.collections,
				relations: relationsStore.relations,
				getPrimaryKeyFieldForCollection: fieldsStore.getPrimaryKeyFieldForCollection,
			}),
			target: { collection: data.collection, key: data.item },
			hint: {
				attachment: {
					collection: data.collection,
					item: data.item,
					version: data.version,
					parent: {
						collection: data.parent.collection,
						key: data.parent.item,
						versionKey: data.parent.version,
					},
				},
			},
			collectionHasVersioning: (collection) => Boolean(collectionsStore.getCollection(collection)?.meta?.versioning),
			readParent: async (parent, readFields) => {
				await ensureVersionId(api, {
					collection: parent.collection,
					item: parent.key,
					versionKey: parent.versionKey,
				});

				return fetchItem(parent.collection, parent.key, readFields, parent.versionKey);
			},
		});

		if (target.kind === 'refuse') return null;

		if (target.kind !== 'parent-version') {
			const versionKey = target.kind === 'item-version' ? target.versionKey : undefined;
			return fetchItem(data.collection, data.item, fields, versionKey);
		}

		const parent = await fetchItem(
			target.parent.collection,
			target.parent.key,
			getParentSnapshotFields(target.relation, fields),
			target.parent.versionKey,
		);

		if (!parent) return null;
		return getSnapshotFromParent(parent, target.relation, data.collection, data.item);
	};

	const fetchContextData = async (): Promise<ContextAttachment[]> => {
		const nonFileItems = pendingContext.value.filter((item) => !isFileContext(item) && !isLocalFileContext(item));

		const fetches = nonFileItems.map(async (item): Promise<ContextAttachment | null> => {
			if (isVisualElement(item)) {
				const fields = item.data.fields?.length ? item.data.fields : ['*'];
				const snapshot = await fetchVisualElementSnapshot(item.data, fields);
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

	const uploadPendingFiles = async (provider?: string): Promise<UploadedFileResult[]> => {
		if (!provider) return [];

		const fileItems = pendingContext.value.filter((item) => isFileContext(item) || isLocalFileContext(item));

		if (fileItems.length === 0) return [];

		const results = await Promise.all(
			fileItems.map(async (item) => {
				try {
					let file: File;
					let displayUrl: string;

					if (isLocalFileContext(item)) {
						file = item.data.file;
						displayUrl = item.data.thumbnailUrl ?? '';
					} else if (isFileContext(item)) {
						const assetResponse = await api.get(`/assets/${item.data.id}`, { responseType: 'blob' });
						file = new File([assetResponse.data], item.data.filename_download, { type: item.data.type });
						displayUrl = `/assets/${item.data.id}`;
					} else {
						return null;
					}

					const ref = await uploadFileToProvider(file, provider);

					return { ref, display: item.display, displayUrl, mimeType: file.type };
				} catch (error) {
					unexpectedError(error);

					notify({
						title: i18n.global.t('ai.file_upload_failed', { name: item.display }),
						type: 'warning',
					});

					return null;
				}
			}),
		);

		return results.filter((r): r is UploadedFileResult => r !== null);
	};

	const dehydrate = () => {
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

function getParentSnapshotFields(relation: ParentRelation, fields: string[]) {
	const childFields = fields.includes('*') ? ['*'] : Array.from(new Set([relation.childPkField, ...fields]));

	if (relation.kind === 'm2o' || relation.kind === 'o2m') {
		return childFields.map((field) => `${relation.parentField}.${field}`);
	}

	const parentFields = [
		`${relation.parentField}.${relation.junctionPkField}`,
		...childFields.map((field) => `${relation.parentField}.${relation.junctionField}.${field}`),
	];

	if (relation.kind === 'm2a') {
		parentFields.push(`${relation.parentField}.${relation.collectionField}`);
	}

	return parentFields;
}

function getSnapshotFromParent(
	parent: Item,
	relation: ParentRelation,
	targetCollection: string,
	targetKey: PrimaryKey,
): Item | null {
	if (relation.kind === 'm2o') {
		const child = parent[relation.parentField];
		if (!isItem(child)) return null;
		if (!sameKey(child[relation.childPkField], targetKey)) return null;
		return child;
	}

	const relatedItems = parent[relation.parentField];
	if (!Array.isArray(relatedItems)) return null;

	if (relation.kind === 'o2m') {
		return relatedItems.find((child) => isItem(child) && sameKey(child[relation.childPkField], targetKey)) ?? null;
	}

	for (const junctionItem of relatedItems) {
		if (!isItem(junctionItem)) continue;
		if (relation.kind === 'm2a' && junctionItem[relation.collectionField] !== targetCollection) continue;

		const child = junctionItem[relation.junctionField];
		if (!isItem(child)) continue;
		if (sameKey(child[relation.childPkField], targetKey)) return child;
	}

	return null;
}

function isItem(value: unknown): value is Item {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sameKey(left: unknown, right: PrimaryKey) {
	return String(left) === String(right);
}
