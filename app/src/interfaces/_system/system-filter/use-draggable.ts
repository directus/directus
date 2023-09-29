import { Filter } from '@directus/types';
import { ref } from 'vue';

export function useDraggable(filterSync) {
	const movingIndex = ref(null);
	const futureIndex = ref(null);

	function onDragMove(e) {
		const { index, futureIndex: newIndex } = e.draggedContext;
		movingIndex.value = index;
		futureIndex.value = newIndex;
		return false;
	}

	function onDragEnd() {
		const futureItem = filterSync.value[futureIndex.value];
		const movingItem = filterSync.value[movingIndex.value];
		const items = [...filterSync.value];
		items[futureIndex.value] = movingItem;
		items[movingIndex.value] = futureItem;

		filterSync.value = items;
	}

	return {
		onDragMove,
		onDragEnd,
	};
}
