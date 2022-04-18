import api from '@/api';
import { getEndpoint } from '@/utils/get-endpoint';
import { unexpectedError } from '@/utils/unexpected-error';
import { clamp, cloneDeep, isEqual, merge, isPlainObject } from 'lodash';
import { computed, ref, Ref, watch } from 'vue';
import { RelationM2A, RelationM2M, RelationO2M } from '@/composables/use-relation';

export type RelationQueryMultiple = {
	page: number;
	limit: number;
	fields: string[];
};

export type DisplayItem = {
	[key: string]: any;
	$index?: number;
	$type?: 'created' | 'updated' | 'deleted';
	$edits?: number;
};

export type Item = {
	create: Record<string, any>[];
	update: Record<string, any>[];
	delete: (string | number)[];
};

export function useRelationMultiple(
	value: Ref<Record<string, any> | any[]>,
	previewQuery: Ref<RelationQueryMultiple>,
	relation: Ref<RelationM2A | RelationM2M | RelationO2M | undefined>,
	itemId: Ref<string | number>
) {
	const loading = ref(false);
	const fetchedItems = ref<Record<string, any>[]>([]);
	const existingItemCount = ref(0);

	const { cleanItem, getPage, localDelete } = useUtil();

	const _value = computed<Item>({
		get() {
			if (Array.isArray(value.value))
				return {
					create: [],
					update: [],
					delete: [],
				};
			return value.value as Item;
		},
		set(newValue) {
			value.value = newValue;
		},
	});

	watch(value, (newValue, oldValue) => {
		if (Array.isArray(newValue) && isPlainObject(oldValue)) {
			updateFetchedItems();
		}
	});

	watch(previewQuery, updateFetchedItems, { immediate: true });

	const { fetchedSelectItems, selected, isItemSelected } = useSelected();

	const totalItemCount = computed(() => {
		if (relation.value?.type === 'o2m') {
			return existingItemCount.value + _value.value.create.length + selected.value.length;
		}

		return existingItemCount.value + _value.value.create.length;
	});

	const createdItems = computed(() => {
		const info = relation.value;
		if (info?.type === undefined) return [];

		if (info.type === 'o2m') return _value.value.create;
		return _value.value.create.filter((item) => item[info.reverseJunctionField.field] === undefined);
	});

	const displayItems = computed(() => {
		if (!relation.value) return [];

		const targetPKField =
			relation.value.type === 'o2m'
				? relation.value.relatedPrimaryKeyField.field
				: relation.value.junctionPrimaryKeyField.field;

		const items: DisplayItem[] = fetchedItems.value.map((item: Record<string, any>) => {
			const editsIndex = _value.value.update.findIndex(
				(edit) => typeof edit === 'object' && edit[targetPKField] === item[targetPKField]
			);
			const deleteIndex = _value.value.delete.findIndex((id) => id === item[targetPKField]);

			const updatedItem = cloneDeep(item);

			if (editsIndex !== -1) {
				merge(
					updatedItem,
					{ $type: 'updated', $index: editsIndex, $edits: editsIndex },
					_value.value.update[editsIndex]
				);
			}
			if (deleteIndex !== -1) {
				merge(updatedItem, { $type: 'deleted', $index: deleteIndex });
			}

			return updatedItem;
		});

		const selectedOnPage = fetchedSelectItems.value.map((item) => {
			const edits = selected.value.find((edit) => {
				switch (relation.value?.type) {
					case 'o2m':
						return edit[targetPKField] === item[targetPKField];
					case 'm2m':
						return (
							edit[relation.value.junctionField.field][relation.value.relatedPrimaryKeyField.field] ===
							item[relation.value.junctionField.field][relation.value.relatedPrimaryKeyField.field]
						);
					case 'm2a': {
						const itemCollection = item[relation.value.collectionField.field];
						const editCollection = edit[relation.value.collectionField.field];
						const itemPkField = relation.value.relationPrimaryKeyFields[itemCollection].field;
						const editPkField = relation.value.relationPrimaryKeyFields[editCollection].field;

						return (
							itemCollection === editCollection &&
							edit[relation.value.junctionField.field][editPkField] ===
								item[relation.value.junctionField.field][itemPkField]
						);
					}
				}
			});

			if (!edits) return item;
			return merge({}, item, edits);
		});

		const newItems = getPage(existingItemCount.value + selected.value.length, createdItems.value);

		items.push(
			...selectedOnPage,
			...newItems.map((item, index) => {
				return {
					...item,
					$type: 'created',
					$index: index,
				} as DisplayItem;
			})
		);

		const sortField = relation.value.sortField;

		if ((previewQuery.value.limit > 0 && totalItemCount.value > previewQuery.value.limit) || !sortField) return items;

		return items.sort((a, b) => {
			return a[sortField] - b[sortField];
		});
	});

	const { create, remove, select, update } = useActions(_value);

	return {
		create,
		update,
		remove,
		select,
		displayItems,
		totalItemCount,
		loading,
		selected,
		fetchedSelectItems,
		fetchedItems,
		useActions,
		cleanItem,
		isItemSelected,
		localDelete,
	};

	function useActions(target: Ref<Item>) {
		return { create, update, remove, select };

		function create(...items: Record<string, any>[]) {
			for (const item of items) {
				target.value.create.push(cleanItem(item));
			}
			updateValue();
		}

		function update(...items: DisplayItem[]) {
			if (!relation.value) return;

			for (const item of items) {
				if (item.$type === undefined || item.$index === undefined) {
					target.value.update.push(item);
				} else if (item.$type === 'created') {
					target.value.create[item.$index] = cleanItem(item);
				} else if (item.$type === 'updated') {
					target.value.update[item.$index] = cleanItem(item);
				} else if (item.$type === 'deleted') {
					if (item.$edits !== undefined) {
						target.value.update[item.$edits] = cleanItem(item);
					} else {
						target.value.update.push(cleanItem(item));
					}
				}
			}
			updateValue();
		}

		function remove(...items: DisplayItem[]) {
			if (!relation.value) return;

			const pkField =
				relation.value.type === 'o2m'
					? relation.value.relatedPrimaryKeyField.field
					: relation.value.junctionPrimaryKeyField.field;

			for (const item of items) {
				if (item.$type === undefined || item.$index === undefined) {
					target.value.delete.push(item[pkField]);
				} else if (item.$type === 'created') {
					target.value.create.splice(item.$index, 1);
				} else if (item.$type === 'updated') {
					if (isItemSelected(item)) {
						target.value.update.splice(item.$index, 1);
					} else {
						target.value.delete.push(item[pkField]);
					}
				} else if (item.$type === 'deleted') {
					target.value.delete.splice(item.$index, 1);
				}
			}
			updateValue();
		}

		function select(items: (string | number)[], collection?: string) {
			const info = relation.value;
			if (!info) return;

			const selected = items.map((item) => {
				switch (info.type) {
					case 'o2m':
						return {
							[info.reverseJunctionField.field]: itemId.value,
							[info.relatedPrimaryKeyField.field]: item,
						};
					case 'm2m':
						return {
							[info.reverseJunctionField.field]: itemId.value,
							[info.junctionField.field]: {
								[info.relatedPrimaryKeyField.field]: item,
							},
						};
					case 'm2a': {
						if (!collection) throw new Error('You need to provide a collection on an m2a');

						return {
							[info.reverseJunctionField.field]: itemId.value,
							[info.collectionField.field]: collection,
							[info.junctionField.field]: {
								[info.relationPrimaryKeyFields[collection].field]: item,
							},
						};
					}
				}
			});

			if (relation.value?.type === 'o2m') update(...selected);
			else create(...selected);
		}

		function updateValue() {
			target.value = cloneDeep(target.value);
		}
	}

	async function updateFetchedItems() {
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
				for (const collection of relation.value.allowedCollections) {
					const pkField = relation.value.relationPrimaryKeyFields[collection.collection];
					fields.add(`${relation.value.junctionField.field}:${collection.collection}.${pkField.field}`);
				}
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

		if (relation.value.sortField) fields.add(relation.value.sortField);

		try {
			loading.value = true;

			await updateItemCount(targetCollection, targetPKField, reverseJunctionField);

			if (!itemId.value || itemId.value === '+') {
				fetchedItems.value = [];
			} else {
				const response = await api.get(getEndpoint(targetCollection), {
					params: {
						fields: Array.from(fields),
						filter: {
							[reverseJunctionField]: itemId.value,
						},
						page: previewQuery.value.page,
						limit: previewQuery.value.limit,
					},
				});

				fetchedItems.value = response.data.data;
			}
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			loading.value = false;
		}
	}

	async function updateItemCount(targetCollection: string, targetPKField: string, reverseJunctionField: string) {
		if (!itemId.value || itemId.value === '+') {
			existingItemCount.value = 0;
			return;
		}
		const response = await api.get(getEndpoint(targetCollection), {
			params: {
				aggregate: {
					count: targetPKField,
				},
				filter: {
					[reverseJunctionField]: itemId.value,
				},
			},
		});

		existingItemCount.value = Number(response.data.data[0].count[targetPKField]);
	}

	function useSelected() {
		const fetchedSelectItems = ref<Record<string, any>[]>([]);

		const selected = computed(() => {
			const info = relation.value;
			if (!info) return [];

			if (relation.value?.type === 'o2m') {
				return _value.value.update
					.map((item, index) => ({ ...item, $index: index, $type: 'updated' } as DisplayItem))
					.filter(isItemSelected);
			}

			return _value.value.create
				.map((item, index) => ({ ...item, $index: index, $type: 'created' } as DisplayItem))
				.filter(isItemSelected);
		});

		const selectedOnPage = computed(() => getPage(existingItemCount.value, selected.value));

		watch(
			selectedOnPage,
			(newVal, oldVal) => {
				if (!isEqual(newVal, oldVal)) loadSelectedDisplay();
			},
			{ immediate: true }
		);

		return { fetchedSelectItems, selected, isItemSelected };

		function isItemSelected(item: DisplayItem) {
			return relation.value !== undefined && item[relation.value.reverseJunctionField.field] !== undefined;
		}

		async function loadSelectedDisplay() {
			switch (relation.value?.type) {
				case 'o2m':
					return loadSelectedDisplayO2M(relation.value);
				case 'm2m':
					return loadSelectedDisplayM2M(relation.value);
				case 'm2a':
					return loadSelectedDisplayM2A(relation.value);
			}
		}

		async function loadSelectedDisplayO2M(relation: RelationO2M) {
			if (selectedOnPage.value.length === 0) {
				fetchedSelectItems.value = [];
				return;
			}

			const targetCollection = relation.relatedCollection.collection;
			const targetPKField = relation.relatedPrimaryKeyField.field;

			const response = await api.get(getEndpoint(targetCollection), {
				params: {
					filter: {
						[targetPKField]: {
							_in: selectedOnPage.value.map((item) => item[targetPKField]),
						},
					},
					limit: -1,
				},
			});

			fetchedSelectItems.value = response.data.data;
		}

		async function loadSelectedDisplayM2M(relation: RelationM2M) {
			if (selectedOnPage.value.length === 0) {
				fetchedSelectItems.value = [];
				return;
			}

			const relatedPKField = relation.relatedPrimaryKeyField.field;

			const response = await api.get(getEndpoint(relation.relatedCollection.collection), {
				params: {
					filter: {
						[relatedPKField]: {
							_in: selectedOnPage.value.map((item) => item[relation.junctionField.field][relatedPKField]),
						},
					},
					limit: -1,
				},
			});

			fetchedSelectItems.value = response.data.data.map((item: Record<string, any>) => ({
				[relation.junctionField.field]: item,
			}));
		}

		async function loadSelectedDisplayM2A(relation: RelationM2A) {
			if (selectedOnPage.value.length === 0) {
				fetchedSelectItems.value = [];
				return;
			}

			const collectionField = relation.collectionField.field;

			const selectGrouped = selectedOnPage.value.reduce((acc, item) => {
				const collection = item[collectionField];
				if (!(collection in acc)) acc[collection] = [];
				acc[collection].push(item);

				return acc;
			}, {} as Record<string, DisplayItem[]>);

			const responses = await Promise.all(
				Object.entries(selectGrouped).map(([collection, items]) => {
					const pkField = relation.relationPrimaryKeyFields[collection].field;

					return api.get(getEndpoint(collection), {
						params: {
							filter: {
								[pkField]: {
									_in: items.map((item) => item[relation.junctionField.field][pkField]),
								},
							},
							limit: -1,
						},
					});
				})
			);

			fetchedSelectItems.value = responses.reduce((acc, item, index) => {
				acc.push(
					...item.data.data.map((item: Record<string, any>) => ({
						[relation.collectionField.field]: Object.keys(selectGrouped)[index],
						[relation.junctionField.field]: item,
					}))
				);
				return acc;
			}, [] as Record<string, any>[]);
		}
	}

	function useUtil() {
		return { cleanItem, getPage, localDelete };

		function cleanItem(item: DisplayItem) {
			return Object.entries(item).reduce((acc, [key, value]) => {
				if (!key.startsWith('$')) acc[key] = value;
				return acc;
			}, {} as DisplayItem);
		}

		function localDelete(item: DisplayItem) {
			return item.$type !== undefined && (item.$type !== 'updated' || isItemSelected(item));
		}

		function getPage<T>(offset: number, items: T[]) {
			if (previewQuery.value.limit === -1) return items;
			const start = clamp((previewQuery.value.page - 1) * previewQuery.value.limit - offset, 0, items.length);
			const end = clamp(previewQuery.value.page * previewQuery.value.limit - offset, 0, items.length);
			return items.slice(start, end);
		}
	}
}
