import { Ref, ref, computed } from '@vue/composition-api';
import { Sort } from '@/components/v-table/types';
import { sortBy } from 'lodash';

export default function useSort(
	sortField: Ref<string | null>,
	fields: Ref<string[]>,
	items: Ref<Record<string, any>[]>,
	emit: (newVal: any[] | null) => void
) {
	const sort = ref<Sort>({ by: sortField.value || fields.value[0], desc: false });

	const sortedItems = computed(() => {
		const sField = sortField.value;
		if (sField === null || sort.value.by !== sField) return null;

		const desc = sort.value.desc;
		const sorted = sortBy(items.value, [sField]);
		return desc ? sorted.reverse() : sorted;
	});

	return { sort, sortItems, sortedItems };

	function sortItems(newItems: Record<string, any>[]) {
		const sField = sortField.value;
		if (sField === null) return;

		const itemsSorted = newItems.map((item, i) => {
			item[sField] = i;
			return item;
		});

		emit(itemsSorted);
	}
}
