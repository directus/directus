import api from '@/api';
import { RelationM2A } from '@/composables/use-relation-m2a';
import { RelationM2M } from '@/composables/use-relation-m2m';
import { RelationO2M } from '@/composables/use-relation-o2m';
import { fetchAll } from '@/utils/fetch-all';
import { unexpectedError } from '@/utils/unexpected-error';
import { Filter, Item } from '@directus/types';
import { getEndpoint, toArray } from '@directus/utils';
import { clamp, cloneDeep, get, isEqual, merge } from 'lodash';
import { Ref, computed, ref, unref, watch } from 'vue';

export type RelationQueryMultiple = {
	page: number;
	limit: number;
	fields: string[];
	search?: string;
	sort?: string[];
	filter?: Filter;
};

export type DisplayItem = {
	[key: string]: any;
	$index?: number;
	$type?: 'created' | 'updated' | 'deleted';
	$edits?: number;
};

export type ChangesItem = {
	create: Record<string, any>[];
	update: Record<string, any>[];
	delete: (string | number)[];
};

export function useRelationMultiple(
	value: Ref<Record<string, any> | any[] | undefined>,
	previewQuery: Ref<RelationQueryMultiple>,
	relation: Ref<RelationM2A | RelationM2M | RelationO2M | undefined>,
	itemId: Ref<string | number>
) {
	const loading = ref(false);
	const fetchedItems = ref<Record<string, any>[]>([]);
	const existingItemCount = ref(0);

	const { cleanItem, getPage, isLocalItem, getItemEdits, isEmpty } = useUtil();

	const _value = computed<ChangesItem>({
		get() {
			if (!value.value || Array.isArray(value.value)) {
				return {
					create: [],
					update: [],
					delete: [],
				};
			}

			return value.value as ChangesItem;
		},
		set(newValue) {
			if (newValue.create.length === 0 && newValue.update.length === 0 && newValue.delete.length === 0) {
				value.value = undefined;
				return;
			}

			value.value = newValue;
		},
	});

	// Fetch new items when the value gets changed by the external "save and stay"
	// We don't want to refresh when we ourself reset the value (when we have no more changes)
	watch(value, (newValue, oldValue) => {
		if (
			Array.isArray(newValue) &&
			oldValue &&
			(('create' in oldValue && Array.isArray(oldValue.create) && oldValue.create.length > 0) ||
				('update' in oldValue && Array.isArray(oldValue.update) && oldValue.update.length > 0) ||
				('delete' in oldValue && Array.isArray(oldValue.delete) && oldValue.delete.length > 0))
		) {
			updateFetchedItems();
		}
	});

	watch([previewQuery, itemId, relation], updateFetchedItems, { immediate: true });

	const { fetchedSelectItems, selected, isItemSelected, selectedOnPage } = useSelected();

	const totalItemCount = computed(() => {
		if (relation.value?.type === 'o2m') {
			return existingItemCount.value + _value.value.create.length + selected.value.length;
		}

		return existingItemCount.value + _value.value.create.length;
	});

	const createdItems = computed(() => {
		const info = relation.value;
		if (info?.type === undefined) return [];

		const items = _value.value.create.map((item, index) => {
			return {
				...item,
				$type: 'created',
				$index: index,
			} as DisplayItem;
		});

		if (info.type === 'o2m') return items;
		return items.filter((item) => item[info.reverseJunctionField.field] === undefined);
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

			let updatedItem: Record<string, any> = cloneDeep(item);

			if (editsIndex !== -1) {
				const edits = unref(_value.value.update[editsIndex]);

				updatedItem = {
					...updatedItem,
					...edits,
				};

				if (relation.value?.type === 'm2m' || relation.value?.type === 'm2a') {
					updatedItem[relation.value.junctionField.field] = {
						...cloneDeep(item)[relation.value.junctionField.field],
						...edits[relation.value.junctionField.field],
					};
				}

				updatedItem.$type = 'updated';
				updatedItem.$index = editsIndex;
				updatedItem.$edits = editsIndex;
			}

			if (deleteIndex !== -1) {
				merge(updatedItem, { $type: 'deleted', $index: deleteIndex });
			}

			return updatedItem;
		});

		const fullSelectedOnPage = selectedOnPage.value.map((edit) => {
			const fetchedItem = fetchedSelectItems.value.find((item) => {
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

			if (!fetchedItem) return edit;
			return merge({}, fetchedItem, edit);
		});

		const newItems = getPage(existingItemCount.value + selected.value.length, createdItems.value);

		items.push(...fullSelectedOnPage, ...newItems);

		const sortField = (previewQuery.value.sort ?? toArray(relation.value.sortField))[0];

		if ((previewQuery.value.limit > 0 && totalItemCount.value > previewQuery.value.limit) || !sortField) return items;

		return items.sort((a, b) => {
			if (sortField.startsWith('-')) {
				const field = sortField.substring(1);
				return get(b, field) - get(a, field);
			}

			return get(a, sortField) - get(b, sortField);
		});
	});

	const { create, remove, select, update } = useActions(_value);

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
					target.value.update.push(cleanItem(item));
				} else if (item.$type === 'created') {
					target.value.create[item.$index] = cleanItem(item);
				} else if (item.$type === 'updated') {
					if (isEmpty(item)) target.value.update.splice(item.$index, 1);
					else target.value.update[item.$index] = cleanItem(item);
				} else if (item.$type === 'deleted') {
					if (item.$edits !== undefined) {
						if (isEmpty(item)) target.value.update.splice(item.$index, 1);
						else target.value.update[item.$edits] = cleanItem(item);
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

		function select(items: (string | number)[] | null, collection?: string) {
			const info = relation.value;
			if (!info) return;

			const selected = items!.map((item) => {
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

		if (!itemId.value || itemId.value === '+') {
			fetchedItems.value = [];
			return;
		}

		let targetCollection: string;
		const reverseJunctionField = relation.value.reverseJunctionField.field;
		const fields = new Set(previewQuery.value.fields);

		switch (relation.value.type) {
			case 'm2a':
				targetCollection = relation.value.junctionCollection.collection;
				fields.add(relation.value.junctionPrimaryKeyField.field);
				fields.add(relation.value.collectionField.field);

				for (const collection of relation.value.allowedCollections) {
					const pkField = relation.value.relationPrimaryKeyFields[collection.collection];
					fields.add(`${relation.value.junctionField.field}:${collection.collection}.${pkField.field}`);
				}

				break;
			case 'm2m':
				targetCollection = relation.value.junctionCollection.collection;
				fields.add(relation.value.junctionPrimaryKeyField.field);
				fields.add(`${relation.value.junctionField.field}.${relation.value.relatedPrimaryKeyField.field}`);
				break;
			case 'o2m':
				targetCollection = relation.value.relatedCollection.collection;
				fields.add(relation.value.relatedPrimaryKeyField.field);
				break;
		}

		if (relation.value.sortField) fields.add(relation.value.sortField);

		try {
			loading.value = true;

			if (itemId.value !== '+') {
				const filter: Filter = { _and: [{ [reverseJunctionField]: itemId.value } as Filter] };

				if (previewQuery.value.filter) {
					filter._and.push(previewQuery.value.filter);
				}

				const response = await api.get(getEndpoint(targetCollection), {
					params: {
						search: previewQuery.value.search,
						fields: Array.from(fields),
						filter,
						page: previewQuery.value.page,
						limit: previewQuery.value.limit,
						sort: previewQuery.value.sort,
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

	watch(
		[previewQuery, itemId, relation],
		(newData, oldData) => {
			const [newPreviewQuery, newItemId, newRelation] = newData;
			const [oldPreviewQuery, oldItemId, oldRelation] = oldData;

			if (
				isEqual(newRelation, oldRelation) &&
				newPreviewQuery.filter === oldPreviewQuery?.filter &&
				newPreviewQuery.search === oldPreviewQuery?.search &&
				newItemId === oldItemId
			) {
				return;
			}

			updateItemCount();
		},
		{ immediate: true }
	);

	async function updateItemCount() {
		if (!relation.value) return;

		if (!itemId.value || itemId.value === '+') {
			existingItemCount.value = 0;
			return;
		}

		let targetCollection: string;
		let targetPKField: string;
		const reverseJunctionField = relation.value.reverseJunctionField.field;

		switch (relation.value.type) {
			case 'm2a':
				targetCollection = relation.value.junctionCollection.collection;
				targetPKField = relation.value.junctionPrimaryKeyField.field;
				break;
			case 'm2m':
				targetCollection = relation.value.junctionCollection.collection;
				targetPKField = relation.value.junctionPrimaryKeyField.field;
				break;
			case 'o2m':
				targetCollection = relation.value.relatedCollection.collection;
				targetPKField = relation.value.relatedPrimaryKeyField.field;
				break;
		}

		const filter: Filter = { _and: [{ [reverseJunctionField]: itemId.value } as Filter] };

		if (previewQuery.value.filter) {
			filter._and.push(previewQuery.value.filter);
		}

		const response = await api.get(getEndpoint(targetCollection), {
			params: {
				search: previewQuery.value.search,
				aggregate: {
					count: targetPKField,
				},
				filter,
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
				if (
					newVal.length !== oldVal?.length ||
					!isEqual(newVal.map(getRelatedIDs), (oldVal ?? []).map(getRelatedIDs))
				) {
					loadSelectedDisplay();
				}
			},
			{ immediate: true }
		);

		return { fetchedSelectItems, selected, isItemSelected, selectedOnPage };

		function getRelatedIDs(item: DisplayItem): string | number | undefined {
			switch (relation.value?.type) {
				case 'o2m':
					return item[relation.value.relatedPrimaryKeyField.field];
				case 'm2m':
					return item[relation.value.junctionField.field][relation.value.relatedPrimaryKeyField.field];

				case 'm2a': {
					const collection = item[relation.value.collectionField.field];
					return item[relation.value.junctionField.field][relation.value.relationPrimaryKeyFields[collection].field];
				}
			}
		}

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

			const fields = new Set(previewQuery.value.fields);
			fields.add(relation.relatedPrimaryKeyField.field);

			if (relation.sortField) fields.add(relation.sortField);

			const targetCollection = relation.relatedCollection.collection;
			const targetPKField = relation.relatedPrimaryKeyField.field;

			fetchedSelectItems.value = await fetchAll(getEndpoint(targetCollection), {
				params: {
					fields: Array.from(fields),
					filter: {
						[targetPKField]: {
							_in: selectedOnPage.value.map(getRelatedIDs),
						},
					},
				},
			});
		}

		async function loadSelectedDisplayM2M(relation: RelationM2M) {
			if (selectedOnPage.value.length === 0) {
				fetchedSelectItems.value = [];
				return;
			}

			const fields = new Set(
				previewQuery.value.fields.reduce<string[]>((acc, field) => {
					const prefix = relation.junctionField.field + '.';

					if (field.startsWith(prefix)) acc.push(field.replace(prefix, ''));
					return acc;
				}, [])
			);

			fields.add(relation.relatedPrimaryKeyField.field);

			const relatedPKField = relation.relatedPrimaryKeyField.field;

			const response = await fetchAll<Record<string, any>[]>(getEndpoint(relation.relatedCollection.collection), {
				params: {
					fields: Array.from(fields),
					filter: {
						[relatedPKField]: {
							_in: selectedOnPage.value.map(getRelatedIDs),
						},
					},
				},
			});

			fetchedSelectItems.value = response.map((item: Record<string, any>) => ({
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

					const fields = new Set(
						previewQuery.value.fields.reduce<string[]>((acc, field) => {
							const prefix = `${relation.junctionField.field}:${collection}.`;

							if (field.startsWith(prefix)) acc.push(field.replace(prefix, ''));
							return acc;
						}, [])
					);

					fields.add(pkField);

					return fetchAll<Record<string, any>[]>(getEndpoint(collection), {
						params: {
							fields: Array.from(fields),
							filter: {
								[pkField]: {
									_in: items.map((item) => item[relation.junctionField.field][pkField]),
								},
							},
						},
					});
				})
			);

			fetchedSelectItems.value = responses.reduce((acc, item, index) => {
				acc.push(
					...item.map((item: Record<string, any>) => ({
						[relation.collectionField.field]: Object.keys(selectGrouped)[index],
						[relation.junctionField.field]: item,
					}))
				);

				return acc;
			}, [] as Record<string, any>[]);
		}
	}

	function useUtil() {
		function cleanItem(item: DisplayItem) {
			return Object.entries(item).reduce((acc, [key, value]) => {
				if (!key.startsWith('$')) acc[key] = value;
				return acc;
			}, {} as DisplayItem);
		}

		/**
		 * Returns if the item doesn't contain any actual changes and can be removed from the changes.
		 */
		function isEmpty(item: DisplayItem): boolean {
			if (item.$type !== 'updated' && item.$edits === undefined) return false;

			const topLevelKeys = Object.keys(item).filter((key) => !key.startsWith('$'));

			if (relation.value?.type === 'o2m') {
				return topLevelKeys.length === 1 && topLevelKeys[0] === relation.value.relatedPrimaryKeyField.field;
			} else if (relation.value?.type === 'm2m') {
				if (topLevelKeys.length === 1 && topLevelKeys[0] === relation.value.junctionPrimaryKeyField.field) return true;

				const deepLevelKeys = Object.keys(item[relation.value.junctionField.field]);

				return (
					topLevelKeys.length === 2 &&
					topLevelKeys.includes(relation.value.junctionField.field) &&
					topLevelKeys.includes(relation.value.junctionPrimaryKeyField.field) &&
					deepLevelKeys.length === 1 &&
					deepLevelKeys[0] === relation.value.relatedPrimaryKeyField.field
				);
			} else if (relation.value?.type === 'm2a') {
				if (topLevelKeys.length === 1 && topLevelKeys[0] === relation.value.junctionPrimaryKeyField.field) return true;

				const deepLevelKeys = Object.keys(item[relation.value.junctionField.field]);

				if (
					topLevelKeys.length === 2 &&
					topLevelKeys.includes(relation.value.junctionField.field) &&
					topLevelKeys.includes(relation.value.junctionPrimaryKeyField.field) &&
					deepLevelKeys.length === 1
				) {
					return true;
				}

				return (
					topLevelKeys.length === 3 &&
					topLevelKeys.includes(relation.value.junctionField.field) &&
					topLevelKeys.includes(relation.value.junctionPrimaryKeyField.field) &&
					topLevelKeys.includes(relation.value.collectionField.field) &&
					deepLevelKeys.length === 1
				);
			}

			return false;
		}

		function isLocalItem(item: DisplayItem) {
			return item.$type !== undefined && (item.$type !== 'updated' || isItemSelected(item));
		}

		function getPage<T>(offset: number, items: T[]) {
			if (previewQuery.value.limit === -1) return items;
			const start = clamp((previewQuery.value.page - 1) * previewQuery.value.limit - offset, 0, items.length);
			const end = clamp(previewQuery.value.page * previewQuery.value.limit - offset, 0, items.length);
			return items.slice(start, end);
		}

		function getItemEdits(item: DisplayItem) {
			if ('$type' in item && item.$index !== undefined) {
				if (item.$type === 'created') {
					return {
						..._value.value.create[item.$index],
						$type: 'created',
						$index: item.$index,
					};
				} else if (item.$type === 'updated') {
					return {
						..._value.value.update[item.$index],
						$type: 'updated',
						$index: item.$index,
					};
				} else if (item.$type === 'deleted' && item.$edits !== undefined) {
					return {
						..._value.value.update[item.$edits],
						$type: 'deleted',
						$index: item.$index,
						$edits: item.$edits,
					};
				}
			}

			return {};
		}

		return { cleanItem, getPage, isLocalItem, getItemEdits, isEmpty };
	}

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
		isLocalItem,
		getItemEdits,
	};
}
