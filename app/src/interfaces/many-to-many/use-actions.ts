import { Ref } from '@vue/composition-api';
import { RelationInfo } from './use-relation';

export default function useActions(
	value: Ref<(string | number | Record<string, any>)[] | null>,
	relation: Ref<RelationInfo>,
	emit: (newValue: any[] | null) => void
) {
	function getJunctionItem(id: string | number) {
		const { junctionPkField } = relation.value;
		if (value.value === null) return null;

		return (
			value.value.find(
				(item) =>
					(typeof item === 'object' && junctionPkField in item && item[junctionPkField] === id) || item === id
			) || null
		);
	}

	function getNewSelectedItems() {
		const { junctionRelation } = relation.value;

		if (value.value === null || junctionRelation === null) return [];

		return value.value.filter(
			(item) => typeof item === 'object' && junctionRelation in item && typeof junctionRelation !== 'object'
		) as Record<string, any>[];
	}

	function getNewItems() {
		const { junctionRelation, relationPkField } = relation.value;

		if (value.value === null || junctionRelation === null) return [];

		return value.value.filter(
			(item) =>
				typeof item === 'object' &&
				junctionRelation in item &&
				typeof item[junctionRelation] === 'object' &&
				relationPkField in item[junctionRelation] === false
		) as Record<string, any>[];
	}

	function getUpdatedItems() {
		const { junctionRelation, relationPkField } = relation.value;

		if (value.value === null || junctionRelation === null) return [];

		return value.value.filter(
			(item) =>
				typeof item === 'object' &&
				junctionRelation in item &&
				typeof item[junctionRelation] === 'object' &&
				relationPkField in item[junctionRelation] === true
		) as Record<string, any>[];
	}

	function getExistingItems() {
		if (value.value === null) return [];

		return value.value.filter((item) => typeof item === 'string' || typeof item === 'number');
	}

	function getPrimaryKeys(): (string | number)[] {
		const { junctionPkField } = relation.value;

		if (value.value === null) return [];

		return value.value
			.map((item) => {
				if (typeof item === 'object') {
					if (junctionPkField in item) return item[junctionPkField];
				} else {
					return item;
				}
			})
			.filter((i) => i);
	}

	function getRelatedPrimaryKeys(): (string | number)[] {
		if (value.value === null) return [];
		const { junctionRelation, relationPkField } = relation.value;
		return value.value
			.map((junctionItem) => {
				if (
					typeof junctionItem !== 'object' ||
					junctionRelation === null ||
					junctionRelation in junctionItem === false
				)
					return undefined;
				const item = junctionItem[junctionRelation];

				if (typeof item === 'object') {
					if (junctionRelation in item) return item[relationPkField];
				} else {
					return item;
				}
			})
			.filter((i) => i);
	}

	function deleteItem(item: Record<string, any>, items: Record<string, any>[]) {
		if (value.value === null) return;
		const { junctionRelation, relationPkField } = relation.value;

		const id = item[relationPkField] as number | string | undefined;

		if (id !== undefined) return deleteItemWithId(id, items);
		if (junctionRelation === null) return;

		const newVal = value.value.filter((junctionItem) => {
			if (typeof junctionItem !== 'object' || junctionRelation in junctionItem === false) return true;
			return junctionItem[junctionRelation] !== item;
		});

		if (newVal.length === 0) emit(null);
		else emit(newVal);
	}

	function deleteItemWithId(id: string | number, items: Record<string, any>[]) {
		if (value.value === null) return;
		const { junctionRelation, relationPkField, junctionPkField } = relation.value;

		const junctionItem = items.find(
			(item) =>
				junctionRelation in item &&
				relationPkField in item[junctionRelation] &&
				item[junctionRelation][relationPkField] === id
		);

		if (junctionItem === undefined) return;

		// If it is a newly selected Item
		if (junctionPkField in junctionItem === false) {
			const newVal = value.value.filter((item) => {
				if (typeof item === 'object' && junctionRelation in item) {
					const jItem = item[junctionRelation];
					return typeof jItem === 'object' ? jItem[relationPkField] !== id : jItem !== id;
				}
				return true;
			});

			if (newVal.length === 0) emit(null);
			else emit(newVal);
			return;
		}

		// If it is an already existing item
		const newVal = value.value.filter((item) => {
			if (typeof item === 'object' && junctionPkField in item) {
				return junctionItem[junctionPkField] !== item[junctionPkField];
			} else {
				return junctionItem[junctionPkField] !== item;
			}
		});

		if (newVal.length === 0) emit(null);
		else emit(newVal);
	}

	function getJunctionFromRelatedId(id: string | number, items: Record<string, any>[]) {
		const { relationPkField, junctionRelation } = relation.value;

		return (
			items.find((item) => {
				return (
					typeof item === 'object' &&
					junctionRelation in item &&
					typeof item[junctionRelation] === 'object' &&
					relationPkField in item[junctionRelation] &&
					item[junctionRelation][relationPkField] === id
				);
			}) || null
		);
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
		deleteItemWithId,
	};
}
