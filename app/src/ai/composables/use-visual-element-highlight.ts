import { useAiStore } from '../stores/use-ai';
import type { PendingContextItem } from '../types';

export function useVisualElementHighlight() {
	const aiStore = useAiStore();

	function highlight(item: PendingContextItem) {
		if (item.type === 'visual-element') {
			aiStore.highlightVisualElement({
				collection: item.data.collection,
				item: item.data.item,
				fields: item.data.fields,
			});
		}
	}

	function clearHighlight() {
		aiStore.highlightVisualElement(null);
	}

	return { highlight, clearHighlight };
}
