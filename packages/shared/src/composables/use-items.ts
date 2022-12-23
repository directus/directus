import { useApi } from './use-system';
import axios from 'axios';
import { useCollection } from './use-collection';
import { Item, Query } from '../types';
import { getEndpoint, moveInArray } from '../utils';
import { isEqual, throttle } from 'lodash';
import { computed, ComputedRef, ref, Ref, watch, WritableComputedRef, unref } from 'vue';

type ManualSortData = {
	item: string | number;
	to: string | number;
};

type UsableItems = {
	itemCount: Ref<number | null>;
	totalCount: Ref<number | null>;
	items: Ref<Item[]>;
	totalPages: ComputedRef<number>;
	loading: Ref<boolean>;
	error: Ref<any>;
	changeManualSort: (data: ManualSortData) => Promise<void>;
	getItems: () => Promise<void>;
	getTotalCount: () => Promise<void>;
	getItemCount: () => Promise<void>;
};

type ComputedQuery = {
	fields: Ref<Query['fields']> | ComputedRef<Query['fields']> | WritableComputedRef<Query['fields']>;
	alias?: Ref<Query['alias']> | ComputedRef<Query['alias']> | WritableComputedRef<Query['alias']>;
	limit: Ref<Query['limit']> | ComputedRef<Query['limit']> | WritableComputedRef<Query['limit']>;
	sort: Ref<Query['sort']> | ComputedRef<Query['sort']> | WritableComputedRef<Query['sort']>;
	search: Ref<Query['search']> | ComputedRef<Query['search']> | WritableComputedRef<Query['search']>;
	filter: Ref<Query['filter']> | ComputedRef<Query['filter']> | WritableComputedRef<Query['filter']>;
	page: Ref<Query['page']> | WritableComputedRef<Query['page']>;
};

export function useItems(collection: Ref<string | null>, query: ComputedQuery): UsableItems {
	const api = useApi();
	const { primaryKeyField } = useCollection(collection);

	const { fields, alias, limit, sort, search, filter, page } = query;

	const endpoint = computed(() => {
		if (!collection.value) return null;
		return getEndpoint(collection.value);
	});

	const items = ref<Item[]>([]);
	const loading = ref(false);
	const error = ref<any>(null);

	const itemCount = ref<number | null>(null);
	const totalCount = ref<number | null>(null);

	const totalPages = computed(() => {
		if (itemCount.value === null) return 1;
		if (itemCount.value < (unref(limit) ?? 100)) return 1;
		return Math.ceil(itemCount.value / (unref(limit) ?? 100));
	});

	const existingRequests: Record<'items' | 'total' | 'filter', AbortController | null> = {
		items: null,
		total: null,
		filter: null,
	};
	let loadingTimeout: NodeJS.Timeout | null = null;

	const fetchItems = throttle(getItems, 500);

	watch(
		[collection, limit, sort, search, filter, fields, page],
		async (after, before) => {
			if (isEqual(after, before)) return;

			const [newCollection, newLimit, newSort, newSearch, newFilter, _newFields, _newPage] = after;
			const [oldCollection, oldLimit, oldSort, oldSearch, oldFilter, _oldFields, _oldPage] = before;

			if (!newCollection || !query) return;

			if (newCollection !== oldCollection) {
				reset();
			}

			if (
				!isEqual(newFilter, oldFilter) ||
				!isEqual(newSort, oldSort) ||
				newLimit !== oldLimit ||
				newSearch !== oldSearch
			) {
				if (oldCollection) {
					page.value = 1;
				}
			}

			if (newCollection !== oldCollection || !isEqual(newFilter, oldFilter) || newSearch !== oldSearch) {
				getItemCount();
			}

			fetchItems();
		},
		{ deep: true, immediate: true }
	);

	return {
		itemCount,
		totalCount,
		items,
		totalPages,
		loading,
		error,
		changeManualSort,
		getItems,
		getItemCount,
		getTotalCount,
	};

	async function getItems() {
		if (!endpoint.value) return;

		let isCurrentRequestCanceled = false;

		if (existingRequests.items) existingRequests.items.abort();
		existingRequests.items = new AbortController();

		error.value = null;

		if (loadingTimeout) {
			clearTimeout(loadingTimeout);
		}

		loadingTimeout = setTimeout(() => {
			loading.value = true;
		}, 150);

		if (unref(totalCount) === null) {
			getTotalCount();
		}

		let fieldsToFetch = [...(unref(fields) ?? [])];

		// Make sure the primary key is always fetched
		if (
			!unref(fields)?.includes('*') &&
			primaryKeyField.value &&
			fieldsToFetch.includes(primaryKeyField.value.field) === false
		) {
			fieldsToFetch.push(primaryKeyField.value.field);
		}

		// Filter out fake internal columns. This is (among other things) for a fake $thumbnail m2o field
		// on directus_files
		fieldsToFetch = fieldsToFetch.filter((field) => field.startsWith('$') === false);

		try {
			const response = await api.get<any>(endpoint.value, {
				params: {
					limit: unref(limit),
					fields: fieldsToFetch,
					...(alias ? { alias: unref(alias) } : {}),
					sort: unref(sort),
					page: unref(page),
					search: unref(search),
					filter: unref(filter),
				},
				signal: existingRequests.items.signal,
			});

			let fetchedItems = response.data.data;
			existingRequests.items = null;

			/**
			 * @NOTE
			 *
			 * This is used in conjunction with the fake field in /src/stores/fields/fields.ts to be
			 * able to render out the directus_files collection (file library) using regular layouts
			 *
			 * Layouts expect the file to be a m2o of a `file` type, however, directus_files is the
			 * only collection that doesn't have this (obviously). This fake $thumbnail field is used to
			 * pretend there is a file m2o, so we can use the regular layout logic for files as well
			 */
			if (collection.value === 'directus_files') {
				fetchedItems = fetchedItems.map((file: any) => ({
					...file,
					$thumbnail: file,
				}));
			}

			items.value = fetchedItems;

			if (page && fetchedItems.length === 0 && page?.value !== 1) {
				page.value = 1;
			}
		} catch (err: any) {
			if (axios.isCancel(err)) {
				isCurrentRequestCanceled = true;
			} else {
				error.value = err;
			}
		} finally {
			if (loadingTimeout && !isCurrentRequestCanceled) {
				clearTimeout(loadingTimeout);
				loadingTimeout = null;
			}

			if (!loadingTimeout) loading.value = false;
		}
	}

	function reset() {
		items.value = [];
		totalCount.value = null;
		itemCount.value = null;
	}

	async function changeManualSort({ item, to }: ManualSortData) {
		const pk = primaryKeyField.value?.field;
		if (!pk) return;

		const fromIndex = items.value.findIndex((existing: Record<string, any>) => existing[pk] === item);
		const toIndex = items.value.findIndex((existing: Record<string, any>) => existing[pk] === to);

		items.value = moveInArray(items.value, fromIndex, toIndex);

		const endpoint = computed(() => `/utils/sort/${collection.value}`);
		await api.post(endpoint.value, { item, to });
	}

	async function getTotalCount() {
		if (!endpoint.value) return;

		try {
			if (existingRequests.total) existingRequests.total.abort();
			existingRequests.total = new AbortController();

			const response = await api.get<any>(endpoint.value, {
				params: {
					aggregate: {
						count: '*',
					},
				},
				signal: existingRequests.total.signal,
			});

			const count = Number(response.data.data[0].count);
			existingRequests.total = null;

			totalCount.value = count;
		} catch (err: any) {
			if (!axios.isCancel(err)) {
				throw err;
			}
		}
	}

	async function getItemCount() {
		if (!endpoint.value) return;

		try {
			if (existingRequests.filter) existingRequests.filter.abort();
			existingRequests.filter = new AbortController();

			const response = await api.get<any>(endpoint.value, {
				params: {
					filter: unref(filter),
					search: unref(search),
					aggregate: {
						count: '*',
					},
				},
				signal: existingRequests.filter.signal,
			});

			const count = Number(response.data.data[0].count);
			existingRequests.filter = null;

			itemCount.value = count;
		} catch (err: any) {
			if (!axios.isCancel(err)) {
				throw err;
			}
		}
	}
}
