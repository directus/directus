import type { Item, Query } from '@directus/types';
import { getEndpoint, moveInArray } from '@directus/utils';
import axios from 'axios';
import { isEqual, throttle } from 'lodash-es';
import type { ComputedRef, Ref, WritableComputedRef } from 'vue';
import { computed, ref, toRef, unref, watch } from 'vue';
import { useCollection } from './use-collection.js';
import { useApi } from './use-system.js';

export type ManualSortData = {
	item: string | number;
	to: string | number;
};

export type UsableItems = {
	itemCount: Ref<number | null>;
	totalCount: Ref<number | null>;
	items: Ref<Item[]>;
	totalPages: ComputedRef<number>;
	loading: Ref<boolean>;
	loadingItemCount: Ref<boolean>;
	error: Ref<any>;
	changeManualSort: (data: ManualSortData) => Promise<void>;
	getItems: () => Promise<void>;
	getTotalCount: () => Promise<void>;
	getItemCount: () => Promise<void>;
};

export type ComputedQuery = {
	fields: Ref<Query['fields']> | ComputedRef<Query['fields']> | WritableComputedRef<Query['fields']>;
	limit: Ref<Query['limit']> | ComputedRef<Query['limit']> | WritableComputedRef<Query['limit']>;
	sort: Ref<Query['sort']> | ComputedRef<Query['sort']> | WritableComputedRef<Query['sort']>;
	search: Ref<Query['search']> | ComputedRef<Query['search']> | WritableComputedRef<Query['search']>;
	filter: Ref<Query['filter']> | ComputedRef<Query['filter']> | WritableComputedRef<Query['filter']>;
	page: Ref<Query['page']> | WritableComputedRef<Query['page']>;
	/** System filter applied to total item count. */
	filterSystem?: Ref<Query['filter']> | ComputedRef<Query['filter']> | WritableComputedRef<Query['filter']>;
	alias?: Ref<Query['alias']> | ComputedRef<Query['alias']> | WritableComputedRef<Query['alias']>;
	deep?: Ref<Query['deep']> | ComputedRef<Query['deep']> | WritableComputedRef<Query['deep']>;
};

export function useItems(collection: Ref<string | null>, query: ComputedQuery): UsableItems {
	const api = useApi();
	const { primaryKeyField } = useCollection(collection);

	const { fields, limit, sort, search, filter, page, filterSystem, alias, deep } = query;

	const endpoint = computed(() => {
		if (!collection.value) return null;
		return getEndpoint(collection.value);
	});

	const items = ref<Item[]>([]);
	const loading = ref(false);
	const loadingItemCount = ref(false);
	const loadingTotalCount = ref(false);
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
	let activeTotalCountPromise: Promise<void> | null = null;
	let lastTotalCountParams: any = null;

	// Throttle is used to ensure we send the first trigger instantly, debounce will not.
	const fetchItems = throttle((shouldUpdateCount: boolean) => {
		Promise.all([getItems(), shouldUpdateCount ? getItemCount() : Promise.resolve()]);
	}, 500);

	watch(
		[collection, limit, sort, search, filter, fields, page, toRef(alias), toRef(deep)],
		async (after, before) => {
			if (isEqual(after, before)) return;

			const [newCollection, newLimit, newSort, newSearch, newFilter] = after;
			const [oldCollection, oldLimit, oldSort, oldSearch, oldFilter] = before;

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

			// determine if the count needs to be updated based on changes to a collection, filter, or search
			const shouldUpdateCount =
				newCollection !== oldCollection || !isEqual(newFilter, oldFilter) || newSearch !== oldSearch;

			fetchItems(shouldUpdateCount);
		},
		{ deep: true, immediate: true },
	);

	watch(
		[collection, toRef(filterSystem)],
		async (after, before) => {
			if (isEqual(after, before)) return;

			getTotalCount();
		},
		{ deep: true, immediate: true },
	);

	return {
		itemCount,
		totalCount,
		items,
		totalPages,
		loading,
		loadingItemCount,
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
					deep: unref(deep),
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

		const currentEndpoint = endpoint.value;

		const aggregate = primaryKeyField.value ? { countDistinct: primaryKeyField.value.field } : { count: '*' };

		const currentParams = {
			aggregate,
			filter: unref(filterSystem),
			collection: collection.value,
		};

		if (loadingTotalCount.value && activeTotalCountPromise && isEqual(currentParams, lastTotalCountParams)) {
			await activeTotalCountPromise;
			return;
		}

		lastTotalCountParams = currentParams;
		loadingTotalCount.value = true;

		const totalPromise = async () => {
			try {
				if (existingRequests.total) {
					existingRequests.total.abort();
				}

				existingRequests.total = new AbortController();

				const response = await api.get<any>(currentEndpoint, {
					params: {
						aggregate,
						filter: unref(filterSystem),
					},
					signal: existingRequests.total.signal,
				});

				const count = primaryKeyField.value
					? Number(response.data.data[0].countDistinct[primaryKeyField.value.field])
					: Number(response.data.data[0].count);

				existingRequests.total = null;

				totalCount.value = count;
			} catch (err: any) {
				if (!axios.isCancel(err)) {
					throw err;
				}
			} finally {
				if (activeTotalCountPromise === currentPromise) {
					activeTotalCountPromise = null;
					loadingTotalCount.value = false;
				}
			}
		};

		const currentPromise = totalPromise();
		activeTotalCountPromise = currentPromise;

		await currentPromise;
	}

	async function getItemCount() {
		if (!endpoint.value) return;

		const filterVal = unref(filter);
		const searchVal = unref(search);
		const filterSystemVal = unref(filterSystem);

		const isFilterEmpty = !filterVal || Object.keys(filterVal).length === 0;
		const isSearchEmpty = !searchVal || searchVal.length === 0;

		if (isSearchEmpty && (isFilterEmpty || isEqual(filterVal, filterSystemVal))) {
			if (totalCount.value !== null && !loadingTotalCount.value) {
				itemCount.value = totalCount.value;
				return;
			}

			try {
				await getTotalCount();
			} catch (e) {
				if (axios.isCancel(e) && activeTotalCountPromise) {
					await activeTotalCountPromise;
				}
			}

			itemCount.value = totalCount.value;
			return;
		}

		loadingItemCount.value = true;

		try {
			if (existingRequests.filter) existingRequests.filter.abort();
			existingRequests.filter = new AbortController();

			const aggregate = primaryKeyField.value
				? {
						countDistinct: primaryKeyField.value.field,
					}
				: {
						count: '*',
					};

			const response = await api.get<any>(endpoint.value, {
				params: {
					filter: filterVal,
					search: searchVal,
					aggregate,
				},
				signal: existingRequests.filter.signal,
			});

			const count = primaryKeyField.value
				? Number(response.data.data[0].countDistinct[primaryKeyField.value.field])
				: Number(response.data.data[0].count);

			existingRequests.filter = null;

			itemCount.value = count;
		} catch (err: any) {
			if (!axios.isCancel(err)) {
				throw err;
			}
		} finally {
			loadingItemCount.value = false;
		}
	}
}
