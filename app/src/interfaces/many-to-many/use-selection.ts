import { Ref, ref, computed } from '@vue/composition-api';
import { RelationInfo } from './use-relation';
import { get } from 'lodash';
import { Filter } from '@/types';

export default function useSelection(
	value: Ref<(string | number | Record<string, any>)[] | null>,
	items: Ref<Record<string, any>[]>,
	relation: Ref<RelationInfo>,
	emit: (newVal: any[] | null) => void
): Record<string, any> {
	const selectModalActive = ref(false);

	const selectedPrimaryKeys = computed(() => {
		if (items.value === null) return [];

		const { relationPkField, junctionField } = relation.value;

		const selectedKeys = items.value.reduce((acc, current) => {
			const key = get(current, [junctionField, relationPkField]);
			if (key !== undefined) acc.push(key);
			return acc;
		}, []) as (number | string)[];

		return selectedKeys;
	});

	const selectionFilters = computed<Filter[]>(() => {
		const { relationPkField } = relation.value;

		if (selectedPrimaryKeys.value.length === 0) return [];

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
		const { junctionField } = relation.value;

		const selection = newSelection.reduce((acc, item) => {
			if (selectedPrimaryKeys.value.includes(item) === false) acc.push({ [junctionField]: item });
			return acc;
		}, [] as Record<string, any>[]);

		const newVal = [...selection, ...(value.value || [])];
		if (newVal.length === 0) emit(null);
		else emit(newVal);
	}

	return { stageSelection, selectModalActive, selectedPrimaryKeys, selectionFilters };
}
