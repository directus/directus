import { computed, ComputedRef, Ref, ref } from 'vue';
import { RelationInfo } from '@/composables/use-relation-info';

type In = {
	items: Ref<Record<string, any> | Record<string, any>[] | null>;
	initialItems: Ref<Record<string, any> | Record<string, any>[] | null>;
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

export function useRelationship({ items, initialItems, relationInfo, emit }: In): Out {
	const { collectionField, sortField, relatedField, junction, related, relation, type } = relationInfo.value;

	const sanitizedItems = computed(() => {
		if (Array.isArray(items.value)) return items.value;

		return items.value ? [items.value] : [];
	});

	const sanitizedInitialItems = computed(() => {
		if (Array.isArray(initialItems.value)) return initialItems.value;

		return initialItems.value ? [initialItems.value] : [];
	});

	const primaryKeyTypes = ['string', 'number'];

	const getPrimaryKey = (itemOrValue: any) => {
		const item = itemOrValue.value !== undefined ? itemOrValue.value : itemOrValue;

		if (!relation || item == null) return null; // strict equality not used in order to handle undefined / null

		if (primaryKeyTypes.includes(typeof item)) return item;

		if (['o2m', 'm2o'].includes(type)) {
			if (primaryKeyTypes.includes(typeof item?.[relation.primaryKey.field])) return item?.[relation.primaryKey.field];

			return null;
		}

		if (['m2m', 'm2a'].includes(type)) {
			const relationPkField =
				type === 'm2m'
					? relation.primaryKey.field
					: related.find((relation) => relation.collection === item[collectionField])?.primaryKey.field ?? '';

			if (primaryKeyTypes.includes(typeof item?.[relatedField]?.[relationPkField]))
				return item?.[relatedField]?.[relationPkField];

			if (primaryKeyTypes.includes(typeof item?.[relatedField])) return item?.[relatedField];

			return null;
		}

		return null;
	};

	function normalize(selection: (number | string)[]) {
		let newVal = null;

		if (!selection?.length) {
			if (type === 'm2a') newVal = sanitizedItems.value.filter((item) => item[collectionField] !== selectingFrom.value);
		} else {
			const createNewItems = sanitizedItems.value.filter((item) => {
				if (!relation) return;

				if (['o2m', 'm2o'].includes(type)) return !item?.[relation.primaryKey.field];

				if (['m2m'].includes(type)) return !item?.[relatedField]?.[relation.primaryKey.field];

				if (['m2a'].includes(type)) {
					const relationPkField = related.find((relation) => relation.collection === item[collectionField])?.primaryKey
						.field;

					if (!relationPkField) return null;

					return !item?.[relatedField]?.[relationPkField];
				}
			});

			newVal = [...createNewItems, ...selection].map((item, i) => {
				const initial = sanitizedInitialItems.value.find((existent) => getPrimaryKey(existent) === getPrimaryKey(item));
				const draft = sanitizedItems.value.find((draft) => getPrimaryKey(draft) === getPrimaryKey(item));
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
		if (type === 'm2o') return emit(null);

		const newVal = sanitizedItems.value.filter((item) => {
			if (!junction) return;

			const isSameJunctionId = toDeselect[junction?.primaryKey.field] == item[junction?.primaryKey.field];

			return !isSameJunctionId;
		});

		emit(newVal?.length ? newVal : []);
	}

	return { stageSelection, deselect, selectingFrom, selectModalActive, selectedPrimaryKeys };
}
