import { Ref } from '@vue/composition-api';

export type RelationFields = {
	junctionPkField: string;
	relationPkField: string;
	junctionRelation: string;
};

export default function useActions(
	value: Ref<(string | number | Record<string, any>)[]>,
	items: Ref<Record<string, any>[]>,
	relationFields: Ref<RelationFields>,
	emit: (newValue: any[] | null) => void
) {
	function getJunctionItem(id: string | number) {
		const { junctionPkField } = relationFields.value;
		if (value.value === null) return null;
		return (
			value.value.find(
				(item) =>
					(typeof item === 'object' && junctionPkField in item && item[junctionPkField] === id) || item === id
			) || null
		);
	}

	function getNewSelectedItems() {
		const { junctionRelation } = relationFields.value;

		if (value.value === null || junctionRelation === null) return [];
		return value.value.filter(
			(item) => typeof item === 'object' && junctionRelation in item && typeof junctionRelation !== 'object'
		) as Record<string, any>[];
	}

	function getNewItems() {
		const { junctionRelation, relationPkField } = relationFields.value;

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
		const { junctionRelation, relationPkField } = relationFields.value;

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

	function getPrimaryKeys() {
		const { junctionPkField } = relationFields.value;

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

	function getRelatedPrimaryKeys() {
		if (value.value === null) return [];
		const { junctionRelation, relationPkField } = relationFields.value;
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

	function deleteItem(item: Record<string, any>) {
		const { junctionRelation, relationPkField } = relationFields.value;

		const id = item[relationPkField] as number | string | undefined;

		if (id !== undefined) return deleteItemWithId(id);
		if (junctionRelation === null) return;

		emit(
			value.value.filter((junctionItem) => {
				if (typeof junctionItem !== 'object' || junctionRelation in junctionItem === false) return true;
				return junctionItem[junctionRelation] !== item;
			})
		);
	}

	function deleteItemWithId(id: string | number) {
		const { junctionRelation, relationPkField, junctionPkField } = relationFields.value;

		const junctionItem = items.value.find(
			(item) =>
				junctionRelation in item &&
				relationPkField in item[junctionRelation] &&
				item[junctionRelation][relationPkField] === id
		);

		if (junctionItem === undefined) return;

		// If it is a newly selected Item
		if (junctionPkField in junctionItem === false) {
			emit(
				value.value.filter((item) => {
					if (typeof item === 'object' && junctionRelation in item) {
						const jItem = item[junctionRelation];
						return typeof jItem === 'object' ? jItem[relationPkField] !== id : jItem !== id;
					}
					return true;
				})
			);
			return;
		}

		// If it is an already existing item
		emit(
			value.value.filter((item) => {
				if (typeof item === 'object' && junctionPkField in item) {
					return junctionItem[junctionPkField] !== item[junctionPkField];
				} else {
					return junctionItem[junctionPkField] !== item;
				}
			})
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
		deleteItem,
		deleteItemWithId,
	};
}
