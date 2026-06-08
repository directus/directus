import { useLocalStorage } from '@vueuse/core';
import { computed, readonly } from 'vue';

interface RecentItem {
	collection: string;
	pk: string;
	displayValue: string;
	versionKey?: string;
	versionId?: string;
}

const STORAGE_KEY = 'command-palette:recent-items';
const TOTAL_LIMIT = 50;
const PER_COLLECTION_LIMIT = 5;

const recentItems = useLocalStorage<RecentItem[]>(STORAGE_KEY, []);

export function useRecentItems(collection?: string) {
	const items = computed(() => {
		if (!collection) return recentItems.value;
		return recentItems.value.filter((item) => item.collection === collection).slice(0, PER_COLLECTION_LIMIT);
	});

	function add(item: RecentItem) {
		const index = recentItems.value.findIndex(
			(i) =>
				i.collection === item.collection &&
				i.pk === item.pk &&
				i.versionKey === item.versionKey &&
				i.versionId === item.versionId,
		);

		if (index !== -1) {
			recentItems.value.splice(index, 1);
		}

		recentItems.value.unshift(item);

		if (recentItems.value.length > TOTAL_LIMIT) {
			recentItems.value.pop();
		}
	}

	return {
		items: readonly(items),
		add,
	};
}
