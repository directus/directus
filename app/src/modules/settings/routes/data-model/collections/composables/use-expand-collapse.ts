import { useExpandCollapse as useExpandCollapseShared } from '@/composables/use-expand-collapse';
import { useCollectionsStore } from '@/stores/collections';

export function useExpandCollapse() {
	const collectionsStore = useCollectionsStore();

	const {
		collapsedIds,
		hasExpandable: hasExpandableCollections,
		expandAll,
		collapseAll,
		toggleCollapse,
	} = useExpandCollapseShared('collapsed-collection-ids', {
		getExpandableIds: () =>
			collectionsStore.allCollections
				.filter(({ meta }) => meta?.group)
				.map(({ collection }) => collection),
		getAllIds: () => collectionsStore.allCollections.map(({ collection }) => collection),
	});

	return { collapsedIds, hasExpandableCollections, expandAll, collapseAll, toggleCollapse };
}
