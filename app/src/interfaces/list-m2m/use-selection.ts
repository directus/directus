import { get } from 'lodash';
import { computed, ComputedRef, Ref, ref } from 'vue';
import { RelationInfo } from './use-relation';

type UsableSelection = {
	stageSelection: (newSelection: (number | string)[]) => void;
	selectModalActive: Ref<boolean>;
	selectedPrimaryKeys: ComputedRef<(string | number)[]>;
};

export default function useSelection(
	items: Ref<Record<string, any>[]>,
	relation: Ref<RelationInfo>,
	emit: (newVal: any[] | null) => void
): UsableSelection {
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

	function stageSelection(newSelection: (number | string)[]) {
		const { junctionField } = relation.value;

		const selection = newSelection.map((item) => ({ [junctionField]: item }));

		if (selection.length === 0) emit(null);
		else emit(selection);
	}

	return { stageSelection, selectModalActive, selectedPrimaryKeys };
}
