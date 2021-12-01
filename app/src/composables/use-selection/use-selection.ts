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

export function useSelection({ items, relationInfo, emit }: In): Out {
	const { collectionField, relatedField, junction, related, relation, type } = relationInfo.value;

	const sanitizedItems = computed(() => {
		if (Array.isArray(items.value)) return items.value;

		return items.value ? [items.value] : [];
	});

	const selectModalActive = ref(false);
	const selectingFrom = ref<string | null>(null);
	const primaryKeyTypes = ['string', 'number'];

	const getPrimaryKey = (itemOrValue: any) => {
		const item = itemOrValue.value !== undefined ? itemOrValue.value : itemOrValue;

		if (!relation || item == null) return null; // strict equality not used to handle undefined / null

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

	const selectedPrimaryKeys = computed(() => {
		const newVal = sanitizedItems.value.flatMap((item) => {
			if (type === 'm2a' && item[collectionField] !== selectingFrom.value) return [];

			const primaryKey = getPrimaryKey(item);

			return primaryKey ? [primaryKey] : [];
		});

		return newVal;
	});

	function stageSelection(selection: (number | string)[]) {
		const selectionItems = selection.map((primaryKey) => {
			const relationPrimaryKeyField = (
				type === 'm2a' ? related.find((relation) => relation.collection === selectingFrom.value) : relation
			)?.primaryKey.field;

			if (!relationPrimaryKeyField) return;

			const relationRelationship = { [relationPrimaryKeyField]: primaryKey };

			if (['o2m', 'm2o'].includes(type)) return { ...relationRelationship };

			if (['m2m', 'm2a'].includes(type)) return { [relatedField]: { ...relationRelationship } };
		});

		const newVal = [...sanitizedItems.value, ...selectionItems];

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
