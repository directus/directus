import { computed, ref, Ref, watch } from '@vue/composition-api';
import api from '@/api';
import useCollection from '@/composables/use-collection';
import Vue from 'vue';
import { isEqual } from 'lodash';
import { Filter } from '@/types/';
import filtersToQuery from '@/utils/filters-to-query';
import { orderBy, throttle } from 'lodash';
import moveInArray from '@/utils/move-in-array';

type Query = {
	limit: Ref<number>;
	fields: Ref<readonly string[]>;
	sort: Ref<string>;
	page: Ref<number>;
	filters: Ref<readonly Filter[]>;
	searchQuery: Ref<string | null>;
};

export function useItems(collection: Ref<string>, query: Query): Record<string, any> {
	const { primaryKeyField, sortField } = useCollection(collection);

	let loadingTimeout: any = null;

	const { limit, fields, sort, page, filters, searchQuery } = query;

	const endpoint = computed(() => {
		return collection.value.startsWith('directus_')
			? `/${collection.value.substring(9)}`
			: `/items/${collection.value}`;
	});

	const items = ref<any>([]);
	const loading = ref(false);
	const error = ref(null);

	const itemCount = ref<number | null>(null);
	const totalCount = ref<number | null>(null);

	const totalPages = computed(() => {
		if (itemCount.value === null) return 1;
		if (itemCount.value < limit.value) return 1;
		return Math.ceil(itemCount.value / limit.value);
	});

	getItems();

	watch(
		collection,
		async (after, before) => {
			if (!before || isEqual(after, before)) {
				return;
			}

			// Waiting for the tick here makes sure the query have been adjusted for the new
			// collection
			await Vue.nextTick();
			reset();
			getItems();
		},
		{ immediate: true }
	);

	watch([page, fields], async (after, before) => {
		if (!before || isEqual(after, before)) {
			return;
		}

		await Vue.nextTick();
		if (loading.value === false) {
			getItems();
		}
	});

	watch(sort, async (after, before) => {
		if (!before || isEqual(after, before)) {
			return;
		}

		// When all items are on page, we only sort locally
		const hasAllItems = limit.value > (itemCount.value || 0);

		if (hasAllItems) {
			sortItems(after);
			return;
		}

		await Vue.nextTick();
		if (loading.value === false) {
			getItems();
		}
	});

	watch([filters, limit], async (after, before) => {
		if (!before || isEqual(after, before)) {
			return;
		}
		page.value = 1;
		await Vue.nextTick();
		if (loading.value === false) {
			getItems();
		}
	});

	watch(
		searchQuery,
		throttle(
			async (after, before) => {
				if (isEqual(after, before)) {
					return;
				}
				page.value = 1;
				await Vue.nextTick();
				if (loading.value === false) {
					getItems();
				}
			},
			500,
			{ trailing: true }
		)
	);

	return { itemCount, totalCount, items, totalPages, loading, error, changeManualSort, getItems };

	async function getItems() {
		if (loadingTimeout) return;

		error.value = null;

		loadingTimeout = setTimeout(() => {
			loading.value = true;
		}, 250);

		let fieldsToFetch = [...fields.value];

		// Make sure the primary key is always fetched
		if (
			fields.value !== ['*'] &&
			primaryKeyField.value &&
			fieldsToFetch.includes(primaryKeyField.value.field) === false
		) {
			fieldsToFetch.push(primaryKeyField.value.field);
		}

		// Make sure all fields that are used to filter are fetched
		if (fields.value !== ['*']) {
			filters.value.forEach((filter) => {
				if (fieldsToFetch.includes(filter.field) === false) {
					fieldsToFetch.push(filter.field);
				}
			});
		}

		// Make sure that the field we're sorting on is fetched
		if (fields.value !== ['*'] && sortField.value && sort.value) {
			const sortFieldKey = sort.value.startsWith('-') ? sort.value.substring(1) : sort.value;
			if (fieldsToFetch.includes(sortFieldKey) === false) {
				fieldsToFetch.push(sortFieldKey);
			}
		}

		// Filter out fake internal columns. This is (among other things) for a fake $thumbnail m2o field
		// on directus_files
		fieldsToFetch = fieldsToFetch.filter((field) => field.startsWith('$') === false);

		try {
			const response = await api.get(endpoint.value, {
				params: {
					limit: limit.value,
					fields: fieldsToFetch,
					sort: sort.value,
					page: page.value,
					search: searchQuery.value,
					...filtersToQuery(filters.value),
				},
			});

			let fetchedItems = response.data.data;

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
			itemCount.value = response.data.data.length;

			if (fetchedItems.length === 0 && page.value !== 1) {
				page.value = 1;
			}

			getItemCount();
		} catch (err) {
			error.value = err;
		} finally {
			clearTimeout(loadingTimeout);
			loadingTimeout = null;
			loading.value = false;
		}
	}

	async function getItemCount() {
		if (!primaryKeyField.value) return;

		const response = await api.get(endpoint.value, {
			params: {
				limit: 0,
				fields: primaryKeyField.value.field,
				meta: ['filter_count', 'total_count'],
				search: searchQuery.value,
				...filtersToQuery(filters.value),
			},
		});

		totalCount.value = response.data.meta.total_count;
		itemCount.value = response.data.meta.filter_count;
	}

	function reset() {
		items.value = [];
		totalCount.value = null;
		itemCount.value = null;
	}

	function sortItems(sortBy: string) {
		const field = sortBy.startsWith('-') ? sortBy.substring(1) : sortBy;
		const descending = sortBy.startsWith('-');
		items.value = orderBy(items.value, [field], [descending ? 'desc' : 'asc']);
	}

	type ManualSortData = {
		item: string | number;
		to: string | number;
	};

	async function changeManualSort({ item, to }: ManualSortData) {
		const pk = primaryKeyField.value?.field;
		if (!pk) return;

		const fromIndex = items.value.findIndex((existing: Record<string, any>) => existing[pk] === item);
		const toIndex = items.value.findIndex((existing: Record<string, any>) => existing[pk] === to);

		items.value = moveInArray(items.value, fromIndex, toIndex);

		const endpoint = computed(() => `/utils/sort/${collection.value}`);
		await api.post(endpoint.value, { item, to });
	}
}
