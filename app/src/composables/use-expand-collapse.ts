import { useLocalStorage } from '@vueuse/core';
import { computed, type ComputedRef } from 'vue';

export interface UseExpandCollapseOptions {
	/** Function that returns all IDs that have children (are expandable) */
	getExpandableIds: () => string[];
	/** Function that returns all IDs for collapse all */
	getAllIds: () => string[];
}

export interface UseExpandCollapseReturn {
	collapsedIds: ReturnType<typeof useLocalStorage<string[]>>;
	hasExpandable: ComputedRef<boolean>;
	expandAll: () => void;
	collapseAll: () => void;
	toggleCollapse: (id: string) => void;
	isCollapsed: (id: string) => boolean;
}

/**
 * Generic composable for managing expand/collapse state of hierarchical items.
 * Used by collections, flows, and other groupable lists.
 *
 * @param storageKey - localStorage key for persisting collapsed state
 * @param options - Configuration options
 */
export function useExpandCollapse(storageKey: string, options: UseExpandCollapseOptions): UseExpandCollapseReturn {
	const collapsedIds = useLocalStorage<string[]>(storageKey, []);

	const hasExpandable = computed(() => options.getExpandableIds().length > 0);

	function expandAll() {
		collapsedIds.value = [];
	}

	function collapseAll() {
		collapsedIds.value = options.getAllIds();
	}

	function toggleCollapse(id: string) {
		const isCurrentlyCollapsed = collapsedIds.value.includes(id);

		if (isCurrentlyCollapsed) {
			collapsedIds.value = collapsedIds.value.filter((collapsedId) => collapsedId !== id);
		} else {
			collapsedIds.value = [...collapsedIds.value, id];
		}
	}

	function isCollapsed(id: string): boolean {
		return collapsedIds.value.includes(id);
	}

	return {
		collapsedIds,
		hasExpandable,
		expandAll,
		collapseAll,
		toggleCollapse,
		isCollapsed,
	};
}
