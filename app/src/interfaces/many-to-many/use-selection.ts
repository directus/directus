import { Ref, ref, computed } from '@vue/composition-api';
import { RelationInfo } from './use-relation';
import { Filter } from '@/types';

export default function useSelection(
	value: Ref<(string | number | Record<string, any>)[] | null>,
	displayItems: Ref<Record<string, any>[]>,
	relation: Ref<RelationInfo>,
	emit: (newVal: any[] | null) => void
) {
	const selectModalActive = ref(false);

	const selectedPrimaryKeys = computed(() => {
		if (displayItems.value === null) return [];

		const { relationPkField } = relation.value;

		const selectedKeys: (number | string)[] = displayItems.value
			.filter((currentItem) => relationPkField in currentItem)
			.map((currentItem) => currentItem[relationPkField]);

		return selectedKeys;
	});

	const selectionFilters = computed<Filter[]>(() => {
		const { relationPkField } = relation.value;

		const filter: Filter = {
			key: 'selection',
			field: relationPkField,
			operator: 'nin',
			value: selectedPrimaryKeys.value.join(','),
			locked: true,
		};

		return [filter];
	});

	function stageSelection(newSelection: (number | string)[]) {
		const { junctionRelation } = relation.value;

		const selection = newSelection
			.filter((item) => selectedPrimaryKeys.value.includes(item) === false)
			.map((item) => ({ [junctionRelation]: item }));

		const newVal = [...selection, ...(value.value || [])];
		if (newVal.length === 0) emit(null);
		else emit(newVal);
	}

	return { stageSelection, selectModalActive, selectedPrimaryKeys, selectionFilters };
}
