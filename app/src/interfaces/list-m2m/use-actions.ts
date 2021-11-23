import { get, has, isEqual } from 'lodash';
import { Ref } from 'vue';
import { RelationInfo } from '@/composables/use-relation-info';

type UsableActions = {
	getJunctionItem: (id: string | number) => string | number | Record<string, any> | null;
	getNewSelectedItems: () => Record<string, any>[];
	getNewItems: () => Record<string, any>[];
	getUpdatedItems: () => Record<string, any>[];
	getExistingItems: () => (string | number | Record<string, any>)[];
	getPrimaryKeys: () => (string | number)[];
	getRelatedPrimaryKeys: () => (string | number)[];
	getJunctionFromRelatedId: (id: string | number, items: Record<string, any>[]) => Record<string, any> | null;
	deleteItem: (deletingItem: Record<string, any>) => void;
};

export default function useActions(
	value: Ref<(string | number | Record<string, any>)[] | null>,
	relation: Ref<RelationInfo>,
	emit: (newValue: any[] | null) => void
): UsableActions {
	// Returns the junction item with the given Id.
	function getJunctionItem(id: string | number) {
		const { junctionPkField } = relation.value;
		if (value.value === null) return null;

		return (
			value.value.find(
				(item) => get(item, junctionPkField) === id || (['string', 'number'].includes(typeof item), item === id)
			) || null
		);
	}

	// Returns all items that have no junction item yet, but an related item does exist.
	function getNewSelectedItems() {
		const { relatedField } = relation.value;

		if (value.value === null || relatedField === null) return [];

		return value.value.filter(
			(item) => typeof item === 'object' && relatedField in item && typeof item[relatedField] !== 'object'
		) as Record<string, any>[];
	}

	// Returns all items that do not have an existing junction and related item.
	function getNewItems() {
		const { junctionPkField, relatedField } = relation.value;

		if (value.value === null || relatedField === null) return [];

		return value.value.filter((item) => typeof item === 'object' && !item[junctionPkField]) as Record<string, any>[];
	}

	// Returns a list of items which related or junction item does exist but had changes.
	function getUpdatedItems() {
		const { relatedField, junctionPkField } = relation.value;

		if (value.value === null || relatedField === null) return [];

		return value.value.filter((item) => typeof item === 'object' && item[junctionPkField]) as Record<string, any>[];
	}

	// Returns only items that do not have any changes what so ever.
	function getExistingItems() {
		if (value.value === null) return [];

		return value.value.filter((item) => ['string', 'number'].includes(typeof item));
	}

	// Get a list of junction item ids.
	function getPrimaryKeys(): (string | number)[] {
		const { junctionPkField } = relation.value;

		if (value.value === null) return [];

		return value.value.reduce((acc: any[], item) => {
			const deepId = get(item, [junctionPkField]) as number | string | undefined;

			if (['string', 'number'].includes(typeof item)) acc.push(item);
			else if (deepId !== undefined) acc.push(deepId);
			return acc;
		}, []) as (string | number)[];
	}

	// Get a list of ids of the related items.
	function getRelatedPrimaryKeys() {
		if (value.value === null) return [];

		const { relatedField, relationPkField } = relation.value;

		return value.value.reduce((acc: any[], item) => {
			const relatedId = get(item, relatedField) as number | string | undefined;
			const deepRelatedId = get(item, [relatedField, relationPkField]) as number | string | undefined;

			if (relatedId !== undefined) acc.push(relatedId);
			else if (deepRelatedId !== undefined) acc.push(deepRelatedId);
			return acc;
		}, []) as (string | number)[];
	}

	function getJunctionFromRelatedId(id: string | number, items: Record<string, any>[]) {
		const { relationPkField, relatedField } = relation.value;

		return items.find((item) => get(item, [relatedField, relationPkField]) === id) || null;
	}

	function deleteItem(deletingItem: Record<string, any>) {
		if (value.value === null) return;
		const { relatedField, relationPkField, junctionPkField } = relation.value;

		const junctionId = get(deletingItem, junctionPkField) as number | string | undefined;
		const relatedId = get(deletingItem, [relatedField, relationPkField]) as number | string | undefined;

		const newValue = value.value.filter((item) => {
			if (junctionId !== undefined) {
				if (typeof item === 'object') {
					return get(item, [junctionPkField]) !== junctionId;
				} else {
					return item !== junctionId;
				}
			}

			if (relatedId !== undefined) {
				const itemRelatedId = get(item, [relatedField, relationPkField]);
				if (['string', 'number'].includes(typeof itemRelatedId)) {
					return itemRelatedId !== relatedId;
				}

				const relatedFieldId = get(item, [relatedField]);
				if (['string', 'number'].includes(typeof relatedFieldId)) {
					return relatedFieldId !== relatedId;
				}
			}

			return isEqual(item, deletingItem) === false;
		});
		emit(newValue);
	}

	return {
		getJunctionItem,
		getNewSelectedItems,
		getNewItems,
		getUpdatedItems,
		getExistingItems,
		getPrimaryKeys,
		getRelatedPrimaryKeys,
		getJunctionFromRelatedId,
		deleteItem,
	};
}
