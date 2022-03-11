import api from '@/api';
import { addRelatedPrimaryKeyToFields } from '@/utils/add-related-primary-key-to-fields';
import { getEndpoint } from '@/utils/get-endpoint';
import { unexpectedError } from '@/utils/unexpected-error';
import { merge } from 'lodash';
import { stringify } from 'querystring';
import { computed, ref, Ref, watch } from 'vue';
import { RelationM2A } from './use-relation-m2a';
import { RelationM2M } from './use-relation-m2m';
import { RelationO2M } from './use-relation-o2m';

type Item = {
	create: Record<string, any>[];
	update: Record<string, any>[];
	delete: (string | number)[];
};

export type RelationQueryMultiple = {
	page: number;
	limit: number;
	fields: string[];
};

export type DisplayItem = {
	[key: string]: any;
	$index?: number;
	$type?: 'created' | 'updated' | 'deleted';
};

export function useRelationMultiple(
	value: Ref<Item>,
	previewQuery: Ref<RelationQueryMultiple>,
	relation: Ref<RelationM2A | RelationM2M | RelationO2M | undefined>,
	itemId: Ref<string | number | null>
) {
	const loading = ref(false);
	const displayItems = ref<DisplayItem[]>([]);
	const existingItemCount = ref(0);
	const totalItemCount = ref(0);

	watch(value, updateDisplayItems, { immediate: true });

	return { create, update, remove, displayItems, totalItemCount };

	function create(item: Record<string, any>) {
		value.value.create.push(item);
	}
	function update(item: DisplayItem) {
		if (!relation.value) return;

		if (!item.$type || !item.$index) {
			value.value.update.push(item);
		} else if (item.$type === 'created') {
			value.value.create.splice(item.$index, 1, { ...item, $type: undefined, $index: undefined });
		} else if (item.$type === 'updated') {
			value.value.update.splice(item.$index, 1, { ...item, $type: undefined, $index: undefined });
		}
	}

	function remove(item: DisplayItem) {
		if (!relation.value) return;

		if (!item.$type || !item.$index) {
			const pkField =
				relation.value.type === 'o2m'
					? relation.value.relatedPrimaryKeyField.field
					: relation.value.junctionPrimaryKeyField.field;
			value.value.delete.push(item[pkField]);
		} else if (item.$type === 'created') {
			value.value.create.splice(item.$index, 1);
		} else if (item.$type === 'updated') {
			value.value.update.splice(item.$index, 1);
		} else if (item.$type === 'deleted') {
			value.value.delete.splice(item.$index, 1);
		}
	}

	async function updateDisplayItems() {
		if (!relation.value) return;

		let targetCollection: string;
		let targetPKField: string;
		let reverseJunctionField: string;
		const fields = new Set(previewQuery.value.fields);

		switch (relation.value.type) {
			case 'm2a':
				targetCollection = relation.value.junctionCollection.collection;
				targetPKField = relation.value.junctionPrimaryKeyField.field;
				reverseJunctionField = relation.value.reverseJunctionField.field;
				fields.add(relation.value.junctionPrimaryKeyField.field);
				fields.add(relation.value.collectionField.field);
				fields.add(relation.value.junctionField.field);
				break;
			case 'm2m':
				targetCollection = relation.value.junctionCollection.collection;
				targetPKField = relation.value.junctionPrimaryKeyField.field;
				reverseJunctionField = relation.value.reverseJunctionField.field;
				fields.add(relation.value.junctionPrimaryKeyField.field);
				fields.add(`${relation.value.junctionField.field}.${relation.value.relatedPrimaryKeyField.field}`);
				break;
			case 'o2m':
				targetCollection = relation.value.relatedCollection.collection;
				targetPKField = relation.value.relatedPrimaryKeyField.field;
				reverseJunctionField = relation.value.reverseJunctionField.field;
				fields.add(relation.value.relatedPrimaryKeyField.field);
				break;
		}

		try {
			loading.value = true;

			await updateItemCount(targetCollection, targetPKField, reverseJunctionField);

			const response = await api.get(getEndpoint(targetCollection), {
				params: {
					fields: fields,
					filter: {
						[reverseJunctionField]: itemId.value,
					},
					page: previewQuery.value.page,
					limit: previewQuery.value.limit,
				},
			});

			const items: DisplayItem[] = response.data.data.map((item: Record<string, any>) => {
				const editsIndex = value.value.update.findIndex(
					(edit) => typeof edit === 'object' && edit[targetPKField] === item[targetPKField]
				);
				const deleteIndex = value.value.delete.findIndex((id) => id === item[targetPKField]);

				if (editsIndex) {
					return merge({ $type: 'updated', $index: editsIndex }, item, value.value.update[editsIndex]);
				} else if (deleteIndex) {
					return merge({ $type: 'deleted', $index: deleteIndex }, item);
				} else {
					return item;
				}
			});

			const createdStart = Math.max(previewQuery.value.page * previewQuery.value.limit - totalItemCount.value, 0);
			const createdEnd = Math.min(createdStart + previewQuery.value.limit, value.value.create.length);

			items.push(
				...value.value.create.slice(createdStart, createdEnd).map((item, index) => {
					return {
						...item,
						$type: 'created',
						$index: index,
					} as DisplayItem;
				})
			);

			displayItems.value = items;
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			loading.value = false;
		}
	}
	async function updateItemCount(collection: string, pkField: string, reverseJunctionField: string) {
		const response = await api.get(getEndpoint(collection), {
			params: {
				aggregate: {
					count: pkField,
				},
				filter: {
					[reverseJunctionField]: itemId.value,
				},
			},
		});

		existingItemCount.value = response.data.data[0].count[pkField];
		totalItemCount.value =
			existingItemCount.value +
			value.value.create.length +
			value.value.update.filter((edit) => {
				// only count items that are newly selected as all other items are already counted in existingItemCount
				switch (relation.value?.type) {
					case 'o2m':
						return relation.value.relation.field in edit;
					case 'm2a':
					case 'm2m':
						return relation.value.reverseJunctionField.field in edit;
				}
			}).length;
	}
}
