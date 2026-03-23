import { useLocalStorage } from '@vueuse/core';
import { computed } from 'vue';
import { useCollectionsStore } from '@/stores/collections';

export function useExpandCollapse() {
	const collectionsStore = useCollectionsStore();
	const collapsedIds = useLocalStorage<string[]>('collapsed-collection-ids', []);

	const hasExpandableCollections = computed(() => collectionsStore.allCollections.some(({ meta }) => meta?.group));

	return { collapsedIds, hasExpandableCollections, expandAll, collapseAll, toggleCollapse };

	function expandAll() {
		collapsedIds.value = [];
	}

	function collapseAll() {
		collapsedIds.value = collectionsStore.allCollections.map(({ collection }) => collection);
	}

	function toggleCollapse(collection: string) {
		const isCollapsed = collapsedIds.value.includes(collection);

		if (isCollapsed) {
			collapsedIds.value = collapsedIds.value.filter((id) => id !== collection);
		} else {
			collapsedIds.value = [...collapsedIds.value, collection];
		}
	}
}
