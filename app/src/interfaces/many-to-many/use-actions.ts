import { Ref } from '@vue/composition-api';
import { RelationInfo } from './use-relation';
import { get, has, isEqual } from 'lodash';

export default function useActions(
	value: Ref<(string | number | Record<string, any>)[] | null>,
	relation: Ref<RelationInfo>,
	emit: (newValue: any[] | null) => void
): Record<string, any> {
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
		const { junctionField } = relation.value;

		if (value.value === null || junctionField === null) return [];

		return value.value.filter(
			(item) => typeof item === 'object' && junctionField in item && typeof item[junctionField] !== 'object'
		) as Record<string, any>[];
	}

	// Returns all items that do not have an existing junction and related item.
	function getNewItems() {
		const { junctionField, relationPkField } = relation.value;

		if (value.value === null || junctionField === null) return [];

		return value.value.filter(
			(item) => typeof get(item, junctionField) === 'object' && has(item, [junctionField, relationPkField]) === false
		) as Record<string, any>[];
	}

	// Returns a list of items which related or junction item does exist but had changes.
	function getUpdatedItems() {
		const { junctionField, relationPkField } = relation.value;

		if (value.value === null || junctionField === null) return [];

		return value.value.filter((item) => has(item, [junctionField, relationPkField])) as Record<string, any>[];
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

		const { junctionField, relationPkField } = relation.value;

		return value.value.reduce((acc: any[], item) => {
			const relatedId = get(item, junctionField) as number | string | undefined;
			const deepRelatedId = get(item, [junctionField, relationPkField]) as number | string | undefined;

			if (relatedId !== undefined) acc.push(relatedId);
			else if (deepRelatedId !== undefined) acc.push(deepRelatedId);
			return acc;
		}, []) as (string | number)[];
	}

	function deleteItem(deletingItem: Record<string, any>) {
		if (value.value === null) return;
		const { junctionField, relationPkField, junctionPkField } = relation.value;

		const junctionId = get(deletingItem, junctionPkField) as number | string | undefined;
		const relatedId = get(deletingItem, [junctionField, relationPkField]) as number | string | undefined;

		const newValue = value.value.filter((item) => {
			if (junctionId !== undefined) {
				if (typeof item === 'object') {
					return get(item, [junctionPkField]) !== junctionId;
				} else {
					return item !== junctionId;
				}
			}

			if (relatedId !== undefined) {
				const itemRelatedId = get(item, [junctionField, relationPkField]);
				if (['string', 'number'].includes(typeof itemRelatedId)) {
					return itemRelatedId !== relatedId;
				}

				const junctionFieldId = get(item, [junctionField]);
				if (['string', 'number'].includes(typeof junctionFieldId)) {
					return junctionFieldId !== relatedId;
				}
			}

			return isEqual(item, deletingItem) === false;
		});
		emit(newValue);
	}

	function getJunctionFromRelatedId(id: string | number, items: Record<string, any>[]) {
		const { relationPkField, junctionField } = relation.value;

		return items.find((item) => get(item, [junctionField, relationPkField]) === id) || null;
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
