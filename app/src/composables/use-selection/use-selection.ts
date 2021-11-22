import { computed, ComputedRef, Ref, ref } from 'vue';
import { RelationInfo } from '@/composables/use-relation-info';

type In = {
	items: Ref<Record<string, any>[] | null>;
	initialItems: Ref<Record<string, any>[] | null>;
	relationInfo: Ref<RelationInfo>;
	emit: (newVal: Record<string, any>[] | Record<string, any> | null) => void;
};

type Out = {
	stageSelection: (newSelection: (number | string)[]) => void;
	selectingFrom: Ref<string | null>;
	selectModalActive: Ref<boolean>;
	selectedPrimaryKeys: ComputedRef<(string | number)[]>;
	deselect: (item: Record<string, any>) => void;
};

export function useSelection({ items, initialItems, relationInfo, emit }: In): Out {
	const { collectionField, sortField, junctionField, junctionPkField, relationPkField, type } = relationInfo.value;

	const selectModalActive = ref(false);
	const selectingFrom = ref<string | null>(null);

	const getPrimaryKey = (itemOrValue: any) => {
		const item = itemOrValue.value !== undefined ? itemOrValue.value : itemOrValue;

		if (item == null) return null; // strict equality not used to handle undefined / null

		if (['string', 'number'].includes(typeof item)) return item;

		if (['o2m', 'm2o'].includes(type)) return item[relationPkField];

		if (['m2m', 'm2a'].includes(type)) return item[junctionField][relationPkField];

		return null;
	};

	const selectedPrimaryKeys = computed(() => {
		const newVal = (items.value || []).flatMap((item) => {
			if (collectionField && item[collectionField] !== selectingFrom.value) return [];

			const primaryKey = getPrimaryKey(item);

			return primaryKey ? [primaryKey] : [];
		});

		return newVal;
	});

	function stageSelection(selection: (number | string)[]) {
		const previousItems = collectionField
			? (items.value || []).filter((item) => item[collectionField] !== selectingFrom.value)
			: items.value || [];

			const newVal = [...previousItems, ...selection].map((item, i) => {
				const initial = (initialItems.value || []).find((existent) => getPrimaryKey(existent) === getPrimaryKey(item));
				const draft = (items.value || []).find((draft) => getPrimaryKey(draft) === getPrimaryKey(item));

			return {
				...initial,
				...draft,
				...(sortField ? { [sortField]: i } : null),
				...(type === 'm2a' ? { [collectionField]: selectingFrom.value } : null),
				...(['o2m', 'm2o'].includes(type) ? { [relationPkField]: getPrimaryKey(item) } : null),
				...(['m2m', 'm2a'].includes(type)
					? {
							[junctionField]: {
								...initial?.[junctionField],
								...draft?.[junctionField],
								[relationPkField]: getPrimaryKey(item),
							},
					  }
					: null),
			};
		});

		if (!newVal?.length) return emit(null);

		if (type === 'm2o') return emit(newVal.pop()?.['id']);

		emit(newVal);
	}

	function deselect(toDeselect: Record<string, any>) {
		const newVal = (items.value || []).filter((item) => {
			const isSameCollection = collectionField ? item[collectionField] === selectingFrom.value : true;
			const isSameJunctionId = toDeselect[junctionPkField] == item[junctionPkField];

			return !(isSameCollection && isSameJunctionId);
		});

		emit(newVal.length === 0 ? null : newVal);
	}

	return { stageSelection, deselect, selectingFrom, selectModalActive, selectedPrimaryKeys };
}
