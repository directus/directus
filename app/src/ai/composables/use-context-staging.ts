import type { VisualElementContextData } from '@directus/ai';
import formatTitle from '@directus/format-title';
import { getEndpoint, getFieldsFromTemplate } from '@directus/utils';
import { nanoid } from 'nanoid';
import { useI18n } from 'vue-i18n';
import { useAiStore } from '../stores/use-ai';
import type { MCPPrompt } from '../types';
import { usePrompts } from './use-prompts';
import api from '@/api';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { notify } from '@/utils/notify';
import { renderDisplayStringTemplate } from '@/utils/render-string-template';
import { unexpectedError } from '@/utils/unexpected-error';

export function useContextStaging() {
	const { t } = useI18n();
	const aiStore = useAiStore();
	const collectionsStore = useCollectionsStore();
	const fieldsStore = useFieldsStore();
	const { convertToUIMessages } = usePrompts();

	function stagePrompt(prompt: MCPPrompt, values: Record<string, string>) {
		try {
			const messages = convertToUIMessages(prompt, values);

			const text = messages.flatMap((m) => m.parts.filter((p) => p.type === 'text').map((p) => p.text)).join('\n\n');

			aiStore.addPendingContext({
				id: nanoid(),
				type: 'prompt',
				data: { text, prompt, values },
				display: formatTitle(prompt.name),
			});

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
			notify({ title: t('error'), type: 'error' });
			return;
		}

		const primaryKey = fieldsStore.getPrimaryKeyFieldForCollection(collection)?.field ?? 'id';

		const displayTemplate = collectionInfo.meta?.display_template || `{{ ${primaryKey} }}`;

		const requiredFields = adjustFieldsForDisplays(getFieldsFromTemplate(displayTemplate), collection);

		const fields = new Set(requiredFields);
		fields.add(primaryKey);

		try {
			const response = await api.get(getEndpoint(collection), {
				params: {
					fields: Array.from(fields),
					filter: { [primaryKey]: { _in: ids } },
				},
			});

			const items: Record<string, unknown>[] = response.data.data ?? [];

			for (const item of items) {
				const itemId = item[primaryKey] as string | number;

				const displayValue =
					renderDisplayStringTemplate(collection, displayTemplate, item) || `${collection} #${itemId}`;

				aiStore.addPendingContext({
					id: nanoid(),
					type: 'item',
					data: { collection, id: itemId, itemData: item },
					display: displayValue,
				});
			}

			notify({ title: t('ai.items_staged'), type: 'success' });
		} catch (error) {
			unexpectedError(error);
		}
	}

	function stageVisualElement(element: VisualElementContextData, displayValue: string) {
		// If in popup, forward to parent window
		if (window.opener) {
			window.opener.postMessage(
				{ action: 'stage-visual-element', data: { element, displayValue } },
				window.location.origin,
			);

			notify({ title: t('ai.element_staged'), type: 'success' });
			return true;
		}

		const collectionInfo = collectionsStore.getCollection(element.collection);

		if (!collectionInfo) {
			notify({ title: t('ai.invalid_collection'), type: 'error' });
			return false;
		}

		const exists = aiStore.pendingContext.some(
			(item) => item.type === 'visual-element' && item.data.key === element.key,
		);

		if (exists) {
			notify({ title: t('ai.element_already_staged'), type: 'warning' });
			return false;
		}

		const added = aiStore.addPendingContext({
			id: nanoid(),
			type: 'visual-element',
			data: element,
			display: displayValue || `${formatTitle(element.collection)} #${element.item}`,
		});

		if (!added) {
			notify({ title: t('ai.max_elements_reached'), type: 'warning' });
			return false;
		}

		notify({ title: t('ai.element_staged'), type: 'success' });
		aiStore.chatOpen = true;
		aiStore.focusInput();
		return true;
	}

	return {
		stagePrompt,
		stageItems,
		stageVisualElement,
	};
}
