import { Ref, ref, computed } from '@vue/composition-api';
import { Sort } from '@/components/v-table/types';
import { sortBy } from 'lodash';
import { RelationInfo } from './use-relation';

export default function useSort(
	relation: Ref<RelationInfo>,
	fields: Ref<string[]>,
	items: Ref<Record<string, any>[]>,
	emit: (newVal: any[] | null) => void
): Record<string, any> {
	const sort = ref<Sort>({ by: relation.value.sortField || fields.value[0], desc: false });

	const sortedItems = computed(() => {
		const sField = relation.value.sortField;
		if (sField === null || sort.value.by !== sField) return items.value;

		const desc = sort.value.desc;
		const sorted = sortBy(items.value, [sField]);
		return desc ? sorted.reverse() : sorted;
	});

	return { sort, sortItems, sortedItems };

	function sortItems(newItems: Record<string, any>[]) {
		const sField = relation.value.sortField;
		if (sField === null) return;

		const itemsSorted = newItems.map((item, i) => {
			item[sField] = i;
			return item;
		});

		emit(itemsSorted);
	}
}
