import { Ref, ref, computed } from '@vue/composition-api';
import { RelationInfo } from './use-relation';

export default function useSelection(
	items: Ref<Record<string, any>[]>,
	displayItems: Ref<Record<string, any>[]>,
	relation: Ref<RelationInfo>,
	emit: (newVal: any[] | null) => void,
	getNewItems: () => Record<string, any>[],
	getJunctionFromRelatedId: (id: string | number, items: Record<string, any>[]) => Record<string, any> | null,
	getJunctionItem: (id: string | number) => string | number | Record<string, any> | null
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

	function stageSelection(newSelection: (number | string)[]) {
		const { junctionRelation, junctionPkField } = relation.value;
		const newItems = getNewItems();

		console.log('A');

		const selection = newSelection.map((item) => {
			const junction = getJunctionFromRelatedId(item, items.value);
			console.log('----');
			console.log('item', item);
			console.log('items', items.value);
			console.log('junction', junction);

			if (junction === null) return { [junctionRelation]: item };

			const updatedItem = getJunctionItem(junction[junctionPkField]);
			console.log(item, ' has Updated: ', updatedItem);

			return updatedItem === null ? { [junctionRelation]: item } : updatedItem;
		});

		const newVal = [...selection, ...newItems];
		if (newVal.length === 0) emit(null);
		else emit(newVal);
	}

	return { stageSelection, selectModalActive, selectedPrimaryKeys };
}
