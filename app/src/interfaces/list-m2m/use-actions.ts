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
	relationInfo: Ref<RelationInfo>,
	emit: (newValue: any[] | null) => void
): UsableActions {
	// Returns the junction item with the given Id.
	function getJunctionItem(id: string | number) {
		const { junction } = relationInfo.value;
		if (!junction || value.value === null) return null;

		return value.value.find((item: any) => (item?.[junction.primaryKey.field] ?? item) === id) || null;
	}

	// Returns all items that have no junction item yet, but an related item does exist.
	function getNewSelectedItems() {
		const { relatedField } = relationInfo.value;

		if (value.value === null || relatedField === null) return [];

		return value.value.filter((item) => typeof item === 'object' && typeof item[relatedField] !== 'object') as Record<
			string,
			any
		>[];
	}

	// Returns all items that do not have an existing junction and related item.
	function getNewItems() {
		const { relation, relatedField } = relationInfo.value;

		if (!relation || value.value === null || relatedField === null) return [];

		return value.value.filter(
			(item) => typeof item === 'object' && !item[relatedField]?.[relation.primaryKey.field]
		) as Record<string, any>[];
	}

	// Returns a list of items which related or junction item does exist but had changes.
	function getUpdatedItems() {
		const { relatedField, relation } = relationInfo.value;

		if (!relation || value.value === null || relatedField === null) return [];

		return value.value.filter(
			(item: any) => typeof item === 'object' && item[relatedField]?.[relation.primaryKey.field]
		) as Record<string, any>[];
	}

	// Returns only items that do not have any changes what so ever.
	function getExistingItems() {
		if (value.value === null) return [];

		return value.value.filter((item) => ['string', 'number'].includes(typeof item));
	}

	// Get a list of junction item ids.
	function getPrimaryKeys(): (string | number)[] {
		const { junction } = relationInfo.value;

		if (!junction || value.value === null) return [];

		return value.value.reduce((acc: any[], item: any) => {
			if (['string', 'number'].includes(typeof item)) acc.push(item);
			else if (typeof item === 'object' && item[junction.primaryKey.field] != null)
				acc.push(item[junction.primaryKey.field]);
			return acc;
		}, []) as (string | number)[];
	}

	// Get a list of ids of the related items.
	function getRelatedPrimaryKeys() {
		const { relatedField, relation } = relationInfo.value;

		if (!relation || value.value === null) return [];

		return value.value.reduce((acc: any[], item: any) => {
			if (typeof item !== 'object') return acc;

			const relatedId = item?.[relatedField] as number | string | undefined;
			const deepRelatedId = item?.[relatedField]?.[relation.primaryKey.field] as number | string | undefined;

			if (relatedId !== undefined) acc.push(relatedId);
			else if (deepRelatedId !== undefined) acc.push(deepRelatedId);
			return acc;
		}, []) as (string | number)[];
	}

	function getJunctionFromRelatedId(id: string | number, items: Record<string, any>[]) {
		const { relation, relatedField } = relationInfo.value;

		if (!relation) return [];

		return (
			items.find((item) => typeof item === 'object' && item[relatedField]?.[relation.primaryKey.field] === id) || null
		);
	}

	function deleteItem(deletingItem: Record<string, any>) {
		if (value.value === null) return;
		const { relatedField, relation, junction } = relationInfo.value;

		if (!relation || !junction) return [];

		const junctionId = deletingItem?.[junction.primaryKey.field] as number | string | undefined;
		const relatedId = deletingItem?.[relatedField]?.[relation.primaryKey.field] as number | string | undefined;

		const newValue = value.value.filter((item: any) => {
			if (junctionId !== undefined) {
				if (typeof item === 'object') {
					return item?.[junction.primaryKey.field] !== junctionId;
				} else {
					return item !== junctionId;
				}
			}

			if (relatedId !== undefined) {
				const itemRelatedId = item?.[relatedField]?.[relation.primaryKey.field];
				if (['string', 'number'].includes(typeof itemRelatedId)) {
					return itemRelatedId !== relatedId;
				}

				const relatedFieldId = item?.[relatedField];
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
