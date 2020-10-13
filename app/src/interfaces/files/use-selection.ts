import { Relation, Filter } from '@/types/';
import { Field } from '@/types';
import { Ref, ref, computed } from '@vue/composition-api';

type SelectionParam = {
	relationCurrentToJunction: Ref<Relation | undefined>;
	relatedCollectionPrimaryKeyField: Ref<Field>;
	previewItems: Ref<readonly any[]>;
	onStageSelection: (selectionAsJunctionRows: any[]) => void;
};

export default function useSelection({
	relationCurrentToJunction,
	relatedCollectionPrimaryKeyField,
	previewItems,
	onStageSelection,
}: SelectionParam) {
	const showBrowseModal = ref(false);

	const alreadySelectedRelatedPrimaryKeys = computed(() => {
		if (!relationCurrentToJunction.value) return [];
		if (!relationCurrentToJunction.value.junction_field) return [];

		const junctionField = relationCurrentToJunction.value.junction_field;
		const relatedPrimaryKey = relatedCollectionPrimaryKeyField.value.field;

		return previewItems.value
			.filter((previewItem: any) => previewItem[junctionField])
			.map((previewItem: any) => {
				if (typeof previewItem[junctionField] === 'string' || typeof previewItem[junctionField] === 'number') {
					return previewItem[junctionField];
				}

				return previewItem[junctionField][relatedPrimaryKey];
			})
			.filter((p) => p);
	});

	const selectionFilters = computed<Filter[]>(() => {
		const relatedPrimaryKey = relatedCollectionPrimaryKeyField.value.field;
		const filter: Filter = {
			key: 'selection',
			field: relatedPrimaryKey,
			operator: 'nin',
			value: alreadySelectedRelatedPrimaryKeys.value.join(','),
			locked: true,
		};

		return [filter];
	});

	return { showBrowseModal, stageSelection, selectionFilters };

	function stageSelection(selection: any) {
		const selectionAsJunctionRows = selection.map((relatedPrimaryKey: string | number) => {
			if (!relationCurrentToJunction.value) return;
			if (!relationCurrentToJunction.value.junction_field) return;

			const junctionField = relationCurrentToJunction.value.junction_field;
			const relatedPrimaryKeyField = relatedCollectionPrimaryKeyField.value.field;

			return {
				[junctionField]: {
					// Technically, "junctionField: primaryKey" should be enough for the api
					// to do it's thing for newly selected items. However, that would require
					// the previewItems check to be way more complex. This shouldn't introduce
					// too much overhead in the API, while drastically simplifying this interface
					[relatedPrimaryKeyField]: relatedPrimaryKey,
				},
			};
		});

		// Seeing the browse modal only shows items that haven't been selected yet (using the
		// filter above), we can safely assume that the items don't exist yet in props.value
		onStageSelection(selectionAsJunctionRows);
	}
}
