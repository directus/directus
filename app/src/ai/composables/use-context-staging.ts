import type { VisualElementContextData } from '@directus/ai';
import formatTitle from '@directus/format-title';
import { Item } from '@directus/types';
import { getEndpoint, getFieldsFromTemplate } from '@directus/utils';
import { nanoid } from 'nanoid';
import { useI18n } from 'vue-i18n';
import { useAiStore } from '../stores/use-ai';
import { useAiContextStore } from '../stores/use-ai-context';
import type { MCPPrompt } from '../types';
import { usePrompts } from './use-prompts';
import sdk, { requestEndpoint } from '@/sdk';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { notify } from '@/utils/notify';
import { renderDisplayStringTemplate } from '@/utils/render-string-template';
import { unexpectedError } from '@/utils/unexpected-error';

export function useContextStaging() {
	const { t } = useI18n();
	const aiStore = useAiStore();
	const contextStore = useAiContextStore();
	const collectionsStore = useCollectionsStore();
	const fieldsStore = useFieldsStore();
	const { convertToUIMessages } = usePrompts();

	function normalizeFields(fields: string[] | undefined): string[] {
		if (!fields?.length) return [];
		return fields.filter((f) => f.length > 0).sort();
	}

	// Visual elements are identified by collection + item + fields, not DOM element key.
	function isSameVisualElement(left: VisualElementContextData, right: VisualElementContextData) {
		if (left.collection !== right.collection) return false;
		if (String(left.item) !== String(right.item)) return false;

		const leftFields = normalizeFields(left.fields);
		const rightFields = normalizeFields(right.fields);

		if (leftFields.length !== rightFields.length) return false;

		return leftFields.every((field, index) => field === rightFields[index]);
	}

	function stagePrompt(prompt: MCPPrompt, values: Record<string, string>) {
		try {
			const messages = convertToUIMessages(prompt, values);

			const text = messages.flatMap((m) => m.parts.filter((p) => p.type === 'text').map((p) => p.text)).join('\n\n');

			const added = contextStore.addPendingContext({
				id: nanoid(),
				type: 'prompt',
				data: { text, prompt, values },
				display: formatTitle(prompt.name),
			});

			if (!added) {
				notify({ title: t('ai.max_elements_reached') });
				return;
			}

			notify({
				title: t('ai.prompt_staged'),
				type: 'success',
			});
		} catch (error) {
			unexpectedError(error);
		}
	}

	async function stageItems(collection: string, ids: (string | number)[] | null) {
		if (!ids || ids.length === 0 || !collection) return;

		const collectionInfo = collectionsStore.getCollection(collection);

		if (!collectionInfo) {
			notify({ title: t('ai.invalid_collection') });
			return;
		}

		const primaryKey = fieldsStore.getPrimaryKeyFieldForCollection(collection)?.field ?? 'id';
		const displayTemplate = collectionInfo.meta?.display_template || `{{ ${primaryKey} }}`;
		const displayFields = getFieldsFromTemplate(displayTemplate);

		try {
			const response = await sdk.request<Item[]>(
				requestEndpoint(getEndpoint(collection), {
					params: {
						fields: [primaryKey, ...displayFields],
						filter: { [primaryKey]: { _in: ids } },
					},
				}),
			);

			const items = response ?? [];

			let stagedCount = 0;

			for (const item of items) {
				const itemId = item[primaryKey] as string | number;

				const displayValue =
					renderDisplayStringTemplate(collection, displayTemplate, item) || `${collection} #${itemId}`;

				const added = contextStore.addPendingContext({
					id: nanoid(),
					type: 'item',
					data: { collection, key: itemId },
					display: displayValue,
				});

				if (!added) break;
				stagedCount++;
			}

			if (stagedCount === 0) {
				notify({ title: t('ai.max_elements_reached') });
			} else if (stagedCount < items.length) {
				notify({ title: t('ai.some_items_staged', { count: stagedCount }) });
			} else {
				notify({ title: t('ai.items_staged') });
			}
		} catch (error) {
			unexpectedError(error);
		}
	}

	async function stageVisualElement(element: VisualElementContextData) {
		// If in popup, forward to parent window
		if (window.opener) {
			window.opener.postMessage({ action: 'stage-visual-element', data: { element } }, window.location.origin);

			notify({ title: t('ai.element_staged') });
			return true;
		}

		const collectionInfo = collectionsStore.getCollection(element.collection);

		if (!collectionInfo) {
			notify({ title: t('ai.invalid_collection') });
			return false;
		}

		const display = await fetchDisplayValue(element, collectionInfo);

		const existingContext = contextStore.pendingContext.find(
			(item) => item.type === 'visual-element' && isSameVisualElement(item.data, element),
		);

		if (existingContext) {
			contextStore.updateVisualElementContext(existingContext.id, element, display);
			notify({ title: t('ai.element_already_staged') });
			return false;
		}

		const added = contextStore.addPendingContext({
			id: nanoid(),
			type: 'visual-element',
			data: element,
			display,
		});

		if (!added) {
			notify({ title: t('ai.max_elements_reached') });
			return false;
		}

		notify({ title: t('ai.element_staged') });
		aiStore.chatOpen = true;
		aiStore.focusInput();
		return true;
	}

	async function fetchDisplayValue(
		element: VisualElementContextData,
		collectionInfo: ReturnType<typeof collectionsStore.getCollection>,
	): Promise<string> {
		const fallback = formatTitle(element.collection);

		if (!element.item || element.item === '+') return fallback;

		try {
			if (element.fields?.length === 1) {
				const field = element.fields[0]!;

				const item = await sdk.request<Item>(
					requestEndpoint(`${getEndpoint(element.collection)}/${encodeURIComponent(element.item)}`, {
						params: { fields: [field] },
					}),
				);

				if (item?.[field]) return String(item[field]);
				return fallback;
			}

			if (!collectionInfo?.meta?.display_template) {
				return formatTitle(element.collection);
			}

			const primaryKey = fieldsStore.getPrimaryKeyFieldForCollection(element.collection)?.field ?? 'id';
			const displayTemplate = collectionInfo.meta.display_template;
			const displayFields = getFieldsFromTemplate(displayTemplate);

			const item = await sdk.request<Item>(
				requestEndpoint(`${getEndpoint(element.collection)}/${encodeURIComponent(element.item)}`, {
					params: { fields: [primaryKey, ...displayFields] },
				}),
			);

			if (!item) return fallback;

			return renderDisplayStringTemplate(element.collection, displayTemplate, item) || fallback;
		} catch {
			return fallback;
		}
	}

	return {
		stagePrompt,
		stageItems,
		stageVisualElement,
	};
}
