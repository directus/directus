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
	const { collectionField, sortField, relatedField, junction, related, relation, type } = relationInfo.value;

	const selectModalActive = ref(false);
	const selectingFrom = ref<string | null>(null);

	const getPrimaryKey = (itemOrValue: any) => {
		const item = itemOrValue.value !== undefined ? itemOrValue.value : itemOrValue;

		if (!relation || item == null) return null; // strict equality not used to handle undefined / null

		if (['string', 'number'].includes(typeof item)) return item;

		if (['o2m', 'm2o'].includes(type)) return item?.[relation.primaryKey.field] ?? null;

		if (['m2m'].includes(type))
			return item?.[relatedField]?.[relation.primaryKey.field] ?? item?.[relatedField] ?? null;

		if (['m2a'].includes(type)) {
			const relationPkField =
				related.find((relation) => relation.collection === item[collectionField])?.primaryKey.field ?? '';

			return item?.[relatedField]?.[relationPkField] ?? item?.[relatedField] ?? null;
		}

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
		let newVal = null;

		if (!selection?.length) {
			if (collectionField) newVal = (items.value || []).filter((item) => item[collectionField] !== selectingFrom.value);
		} else {
			const createNewItems = (items.value || []).filter((item) => {
				if (['o2m', 'm2o'].includes(type)) return !item?.[relationPkField];

				if (['m2m', 'm21'].includes(type)) return !item?.[relatedField]?.[relationPkField];
			});

			newVal = [...createNewItems, ...selection].map((item, i) => {
				const initial = (initialItems.value || []).find((existent) => getPrimaryKey(existent) === getPrimaryKey(item));
				const draft = (items.value || []).find((draft) => getPrimaryKey(draft) === getPrimaryKey(item));
				const relatedPrimaryKey = getPrimaryKey(item);
				const relationPrimaryKeyField = (
					type === 'm2a' ? related.find((relation) => relation.collection === selectingFrom.value) : relation
				)?.primaryKey.field;

				if (!relationPrimaryKeyField) return;

				const relationRelationship = relatedPrimaryKey ? { [relationPrimaryKeyField]: relatedPrimaryKey } : null;
				const sort = sortField ? { [sortField]: draft?.[sortField] ?? i } : null;
				const collection = type === 'm2a' ? { [collectionField]: selectingFrom.value } : null;

				if (['o2m', 'm2o'].includes(type)) return { ...initial, ...draft, ...sort, ...relationRelationship };

				if (['m2m', 'm2a'].includes(type))
					return {
						...initial,
						...draft,
						...sort,
						...collection,
						[relatedField]: {
							...draft?.[relatedField],
							...relationRelationship,
						},
					};
			});
		}

		if (type === 'o2m') return emit(newVal?.length ? newVal : []);

		if (type === 'm2o') return emit(newVal?.length ? newVal.pop()?.['id'] : null);

		emit(newVal?.length ? newVal : null);
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
