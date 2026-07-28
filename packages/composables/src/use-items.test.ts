import type { Filter, Query } from '@directus/types';
import { flushPromises } from '@vue/test-utils';
import type { AxiosInstance } from 'axios';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { type Ref, ref, unref } from 'vue';
import { serializeFilter, useItems } from './use-items.js';
import { useApi } from './use-system.js';

vi.mock('./use-system.js');

vi.mock('./use-collection.js', () => ({
	useCollection: vi.fn(() => ({
		primaryKeyField: ref({ field: 'id' }),
	})),
}));

describe('useItems', () => {
	let mockApiGet: AxiosInstance['get'];

	beforeEach(() => {
		mockApiGet = vi.fn();

		vi.mocked(useApi).mockImplementation(() => ({ get: mockApiGet }) as unknown as AxiosInstance);

		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.clearAllTimers();
		vi.useRealTimers();
		vi.clearAllMocks();
		vi.resetAllMocks();
	});

	test('should call fetchItems immediately on first invocation', async () => {
		const collection = ref('test_collection');

		vi.mocked(mockApiGet).mockResolvedValue({
			data: {
				data: [
					{
						count: 1,
						countDistinct: { id: 1 },
					},
				],
			},
		});

		const query = {
			fields: ref(['id', 'name']),
			limit: ref(25),
			sort: ref(['id']),
			search: ref(''),
			filter: ref({}),
			page: ref(1),
		};

		await useItems(collection, query);

		// Should only call twice immediately (items + total); itemCount reuses totalCount when no filters
		expect(mockApiGet).toHaveBeenCalledTimes(2);
	});

	test('should throttle multiple rapid changes to query parameters', async () => {
		const collection = ref('test_collection');

		vi.mocked(mockApiGet).mockResolvedValue({
			data: {
				data: [
					{
						count: 1,
						countDistinct: { id: 1 },
					},
				],
			},
		});

		const query = {
			fields: ref(['id', 'name']),
			limit: ref(25),
			sort: ref(['id']),
			search: ref(''),
			filter: ref({}),
			page: ref(1),
		};

		await useItems(collection, query);

		// Should only call twice immediately (items + total); itemCount reuses totalCount when no filters
		expect(mockApiGet).toHaveBeenCalledTimes(2);

		// Trigger multiple rapid changes
		query.search.value = 'test1';
		query.search.value = 'test2';
		query.search.value = 'test3';

		// Fast-forward past throttle delay (500ms)
		await vi.advanceTimersByTimeAsync(500);

		// Should have been called: items(2) + total(1) + count(1) — memoize deduplicates totalCount on init
		expect(mockApiGet).toHaveBeenCalledTimes(4);
	});

	test('should allow subsequent calls after throttle period expires', async () => {
		const collection = ref('test_collection');

		vi.mocked(mockApiGet).mockResolvedValue({
			data: {
				data: [
					{
						count: 1,
						countDistinct: { id: 1 },
					},
				],
			},
		});

		const query = {
			fields: ref(['id', 'name']),
			limit: ref(25),
			sort: ref(['id']),
			search: ref(''),
			filter: ref({}),
			page: ref(1),
		};

		await useItems(collection, query);

		// Should only call twice immediately (items + total); itemCount reuses totalCount when no filters
		expect(mockApiGet).toHaveBeenCalledTimes(2);

		// First change (search is now non-empty, so getItemCount makes its own request)
		query.search.value = 'first';
		await vi.advanceTimersByTimeAsync(500);
		expect(mockApiGet).toHaveBeenCalledTimes(4);

		// Wait for throttle to reset
		await vi.advanceTimersByTimeAsync(100);

		// Second change after throttle period
		query.search.value = 'second';
		await vi.advanceTimersByTimeAsync(500);
		expect(mockApiGet).toHaveBeenCalledTimes(6);
	});

	test('should NOT call getItemCount if only limit changes', async () => {
		const collection = ref('test_collection');

		vi.mocked(mockApiGet).mockResolvedValue({
			data: {
				data: [
					{
						count: 1,
						countDistinct: { id: 1 },
					},
				],
			},
		});

		const limit = ref(1);

		const query = {
			fields: ref(['id', 'name']),
			limit,
			sort: ref(['id']),
			search: ref(''),
			filter: ref({}),
			page: ref(1),
		};

		await useItems(collection, query);

		// Should only call twice immediately (items + total); itemCount reuses totalCount when no filters
		expect(mockApiGet).toHaveBeenCalledTimes(2);

		limit.value = 5;

		// Fast-forward past throttle delay (500ms)
		await vi.advanceTimersByTimeAsync(500);

		// Should have been called once due to throttle (items(2), count(1), total(1))
		expect(mockApiGet).toHaveBeenCalledTimes(3);
	});

	test('should reset limit to 1 if filter changes', async () => {
		const collection = ref('test_collection');

		vi.mocked(mockApiGet).mockResolvedValue({
			data: {
				data: [
					{
						count: 1,
						countDistinct: { id: 1 },
					},
				],
			},
		});

		const filter: Ref<null | Filter> = ref(null);

		useItems(collection, {
			fields: ref(['*']),
			limit: ref(1),
			sort: ref(null),
			search: ref(null),
			filter,
			page: ref(5),
		});

		filter.value = { id: { _eq: 1 } };

		// advance throttle
		await vi.advanceTimersByTimeAsync(500);

		expect(mockApiGet).toHaveBeenCalledWith(
			'/items/test_collection',
			expect.objectContaining({
				params: expect.objectContaining({
					page: 1,
				}),
			}),
		);
	});

	test('should reset when collection changes', async () => {
		const collection = ref('old_collection');

		vi.mocked(mockApiGet).mockResolvedValue({
			data: {
				data: [
					{
						count: 1,
						countDistinct: { id: 1 },
					},
				],
			},
		});

		useItems(collection, {
			fields: ref(['*']),
			limit: ref(1),
			sort: ref(null),
			search: ref(null),
			filter: ref(null),
			page: ref(1),
		});

		expect(mockApiGet).toHaveBeenCalledWith('/items/old_collection', expect.any(Object));

		// update collection ref
		collection.value = 'new_collection';

		// advance throttle
		await vi.advanceTimersByTimeAsync(500);

		expect(mockApiGet).toHaveBeenCalledWith('/items/new_collection', expect.any(Object));
	});

	test('should reuse totalCount for itemCount when no filters or search are active', async () => {
		const collection = ref('test_collection');

		vi.mocked(mockApiGet).mockResolvedValue({
			data: {
				data: [
					{
						count: 42,
						countDistinct: { id: 42 },
					},
				],
			},
		});

		const query = {
			fields: ref(['id', 'name']),
			limit: ref(25),
			sort: ref(['id']),
			search: ref<string | null>(null),
			filter: ref<Filter | null>(null),
			page: ref(1),
		};

		const { itemCount, totalCount } = useItems(collection, query);

		await flushPromises();

		// Only 2 API calls: getItems + getTotalCount (getItemCount reuses totalCount)
		expect(mockApiGet).toHaveBeenCalledTimes(2);
		expect(totalCount.value).toBe(42);
		expect(itemCount.value).toBe(42);
	});

	test('should make separate itemCount request when search is active', async () => {
		const collection = ref('test_collection');

		vi.mocked(mockApiGet).mockResolvedValue({
			data: {
				data: [
					{
						count: 10,
						countDistinct: { id: 10 },
					},
				],
			},
		});

		const query = {
			fields: ref(['id', 'name']),
			limit: ref(25),
			sort: ref(['id']),
			search: ref('active search'),
			filter: ref<Filter | null>(null),
			page: ref(1),
		};

		useItems(collection, query);

		await flushPromises();

		// 3 API calls: getItems + getTotalCount + getItemCount (search is active, can't reuse)
		expect(mockApiGet).toHaveBeenCalledTimes(3);
	});

	test('should reuse totalCount when user filter matches system filter', async () => {
		const collection = ref('test_collection');
		const systemFilter = ref<Query['filter']>({ status: { _eq: 'published' } });

		vi.mocked(mockApiGet).mockResolvedValue({
			data: {
				data: [
					{
						count: 15,
						countDistinct: { id: 15 },
					},
				],
			},
		});

		const query = {
			fields: ref(['id', 'name']),
			limit: ref(25),
			sort: ref(['id']),
			search: ref<string | null>(null),
			filter: ref<Filter | null>({ status: { _eq: 'published' } }),
			page: ref(1),
			filterSystem: systemFilter,
		};

		const { itemCount, totalCount } = useItems(collection, query);

		await flushPromises();

		// Only 2 API calls: getItems + getTotalCount (filter matches systemFilter, so itemCount reuses)
		expect(mockApiGet).toHaveBeenCalledTimes(2);
		expect(totalCount.value).toBe(15);
		expect(itemCount.value).toBe(15);
	});

	test('should append $thumbnail to fetched items when collection is directus_files', async () => {
		vi.mocked(mockApiGet).mockResolvedValue({
			data: {
				data: [
					{
						count: 1,
						countDistinct: { id: 1 },
					},
				],
			},
		});

		const collection = ref('directus_files');

		const { items } = useItems(collection, {
			fields: ref(['*']),
			limit: ref(1),
			sort: ref(null),
			search: ref(null),
			filter: ref(null),
			page: ref(1),
		});

		await flushPromises();

		expect(unref(items.value[0]?.['$thumbnail'])).toBeOneOf([expect.any(Object)]);
	});

	describe('version query param', () => {
		test('should skip getItemCount and getTotalCount when version is set', async () => {
			const collection = ref('test_collection');

			vi.mocked(mockApiGet).mockResolvedValue({
				data: {
					data: [{ id: 1 }, { id: 2 }],
				},
			});

			await useItems(collection, {
				fields: ref(['id']),
				limit: ref(25),
				sort: ref(['id']),
				search: ref(''),
				filter: ref({}),
				page: ref(1),
				version: ref('draft'),
			});

			// Only getItems should be called — no aggregate calls for count/total
			expect(mockApiGet).toHaveBeenCalledTimes(1);

			expect(mockApiGet).toHaveBeenCalledWith(
				'/items/test_collection',
				expect.objectContaining({
					params: expect.objectContaining({
						version: 'draft',
					}),
				}),
			);
		});

		test('should derive itemCount and totalCount client-side from fetched items when version is set', async () => {
			const collection = ref('test_collection');
			const fetchedItems = [{ id: 1 }, { id: 2 }, { id: 3 }];

			vi.mocked(mockApiGet).mockResolvedValue({
				data: { data: fetchedItems },
			});

			const { itemCount, totalCount } = useItems(collection, {
				fields: ref(['id']),
				limit: ref(25),
				sort: ref(['id']),
				search: ref(''),
				filter: ref({}),
				page: ref(1),
				version: ref('draft'),
			});

			await flushPromises();

			expect(itemCount.value).toBe(3);
			expect(totalCount.value).toBe(3);
		});

		test('should pass version param to the API request', async () => {
			const collection = ref('test_collection');

			vi.mocked(mockApiGet).mockResolvedValue({
				data: { data: [] },
			});

			await useItems(collection, {
				fields: ref(['id']),
				limit: ref(25),
				sort: ref(['id']),
				search: ref(''),
				filter: ref({}),
				page: ref(1),
				version: ref('draft'),
			});

			expect(mockApiGet).toHaveBeenCalledWith(
				'/items/test_collection',
				expect.objectContaining({
					params: expect.objectContaining({
						version: 'draft',
					}),
				}),
			);
		});

		test('should prevent changeManualSort when version is set', async () => {
			const collection = ref('test_collection');
			const mockApiPost = vi.fn();

			vi.mocked(useApi).mockImplementation(() => ({ get: mockApiGet, post: mockApiPost }) as unknown as AxiosInstance);

			vi.mocked(mockApiGet).mockResolvedValue({
				data: { data: [{ id: 1 }, { id: 2 }] },
			});

			const { changeManualSort } = useItems(collection, {
				fields: ref(['id']),
				limit: ref(25),
				sort: ref(['id']),
				search: ref(''),
				filter: ref({}),
				page: ref(1),
				version: ref('draft'),
			});

			await flushPromises();

			await changeManualSort({ item: 1, to: 2 });

			expect(mockApiPost).not.toHaveBeenCalled();
		});

		test('should refetch with count update when version value changes', async () => {
			const collection = ref('test_collection');
			const version: Ref<string | undefined> = ref(undefined);

			vi.mocked(mockApiGet).mockResolvedValue({
				data: {
					data: [{ count: 1, countDistinct: { id: 1 } }],
				},
			});

			await useItems(collection, {
				fields: ref(['id']),
				limit: ref(25),
				sort: ref(['id']),
				search: ref(''),
				filter: ref({}),
				page: ref(1),
				version,
			});

			// Initial: items + 1 deduped aggregate (itemCount/totalCount share the same memoize key when filter and search are empty)
			expect(mockApiGet).toHaveBeenCalledTimes(2);

			// Switch to draft mode
			version.value = 'draft';

			await vi.advanceTimersByTimeAsync(500);

			// Should call getItems again (no separate count call since version is now set)
			// items(2) + initial deduped aggregate(1) = 3
			expect(mockApiGet).toHaveBeenCalledTimes(3);
		});
	});

	describe('refresh cache bypass', () => {
		test('getItemCount(true) bypasses memoize and reflects mutated count', async () => {
			const collection = ref('test_collection');

			// Initial fetch returns count = 1
			vi.mocked(mockApiGet).mockResolvedValue({
				data: { data: [{ count: 1, countDistinct: { id: 1 } }] },
			});

			// Active search ensures itemCount makes its own aggregate request (can't reuse totalCount)
			const { itemCount, getItemCount } = useItems(collection, {
				fields: ref(['id']),
				limit: ref(25),
				sort: ref(['id']),
				search: ref('foo'),
				filter: ref({}),
				page: ref(1),
			});

			await flushPromises();

			// Initial: items + totalCount + itemCount = 3
			expect(mockApiGet).toHaveBeenCalledTimes(3);
			expect(itemCount.value).toBe(1);

			// Simulate the row being deleted on the server
			vi.mocked(mockApiGet).mockResolvedValue({
				data: { data: [{ count: 0, countDistinct: { id: 0 } }] },
			});

			// Without force the memoize returns the cached `1` and skips the network
			await getItemCount();
			await flushPromises();

			expect(mockApiGet).toHaveBeenCalledTimes(3);
			expect(itemCount.value).toBe(1);

			// With force=true the cache is bypassed and the fresh `0` is observed
			await getItemCount(true);
			await flushPromises();

			expect(mockApiGet).toHaveBeenCalledTimes(4);
			expect(itemCount.value).toBe(0);
		});

		test('getTotalCount(true) bypasses memoize and reflects mutated count', async () => {
			const collection = ref('test_collection');

			vi.mocked(mockApiGet).mockResolvedValue({
				data: { data: [{ count: 1, countDistinct: { id: 1 } }] },
			});

			const { totalCount, getTotalCount } = useItems(collection, {
				fields: ref(['id']),
				limit: ref(25),
				sort: ref(['id']),
				search: ref<string | null>(null),
				filter: ref<Filter | null>(null),
				page: ref(1),
			});

			await flushPromises();

			// Initial: items + totalCount = 2 (itemCount reuses totalCount when no filter/search)
			expect(mockApiGet).toHaveBeenCalledTimes(2);
			expect(totalCount.value).toBe(1);

			vi.mocked(mockApiGet).mockResolvedValue({
				data: { data: [{ count: 0, countDistinct: { id: 0 } }] },
			});

			await getTotalCount();
			await flushPromises();

			expect(mockApiGet).toHaveBeenCalledTimes(2);
			expect(totalCount.value).toBe(1);

			await getTotalCount(true);
			await flushPromises();

			expect(mockApiGet).toHaveBeenCalledTimes(3);
			expect(totalCount.value).toBe(0);
		});
	});

	describe('serializeFilter', () => {
		test('passes filters without _json through untouched', () => {
			const filter = { _and: [{ status: { _eq: 'published' } }] };

			expect(serializeFilter(filter)).toBe(filter);
			expect(serializeFilter(null)).toBe(null);
			expect(serializeFilter(undefined)).toBe(undefined);
		});

		test('stringifies filters containing _json at the top level', () => {
			const filter = { metadata: { _json: { 'data.tags[0]': { _eq: 'featured' } } } };

			expect(serializeFilter(filter)).toBe(JSON.stringify(filter));
		});

		test('detects _json nested under logical groups and relational paths', () => {
			const nestedInGroup = {
				_or: [{ status: { _eq: 'published' } }, { _and: [{ metadata: { _json: { rating: { _gte: '4' } } } }] }],
			};

			const nestedInRelation = { author: { profile: { metadata: { _json: { city: { _eq: 'Berlin' } } } } } };

			expect(serializeFilter(nestedInGroup)).toBe(JSON.stringify(nestedInGroup));
			expect(serializeFilter(nestedInRelation)).toBe(JSON.stringify(nestedInRelation));
		});

		test('stringifies an empty _json filter (initial UI state)', () => {
			const filter = { _and: [{ metadata: { _json: {} } }] };

			expect(serializeFilter(filter)).toBe(JSON.stringify(filter));
		});

		test('does not treat operator values as _json containers', () => {
			const filter = { _and: [{ tags: { _in: ['_json', 'other'] } }] };

			expect(serializeFilter(filter)).toBe(filter);
		});
	});

	describe('filter serialization on requests', () => {
		function mockCountResponse() {
			vi.mocked(mockApiGet).mockResolvedValue({
				data: { data: [{ count: 1, countDistinct: { id: 1 } }] },
			});
		}

		function getRequestFilters() {
			const calls = vi.mocked(mockApiGet).mock.calls as [string, { params: Record<string, any> }][];

			const itemCall = calls.find(([, config]) => config?.params?.['fields']);
			const aggregateCalls = calls.filter(([, config]) => config?.params?.['aggregate'] && config?.params?.['filter']);

			return {
				itemFilter: itemCall?.[1].params['filter'],
				aggregateFilters: aggregateCalls.map(([, c]) => c.params['filter']),
			};
		}

		test('sends non-JSON filters as objects on both item and aggregate requests', async () => {
			mockCountResponse();

			const filter = { _and: [{ status: { _eq: 'published' } }] };

			useItems(ref('test_collection'), {
				fields: ref(['id']),
				limit: ref(25),
				sort: ref(['id']),
				search: ref<string | null>(null),
				filter: ref<Filter | null>(filter),
				page: ref(1),
			});

			await flushPromises();

			const { itemFilter, aggregateFilters } = getRequestFilters();

			expect(itemFilter).toEqual(filter);
			expect(aggregateFilters.length).toBeGreaterThan(0);
			for (const aggregateFilter of aggregateFilters) expect(aggregateFilter).toEqual(filter);
		});

		test('sends filters containing _json as JSON strings on both item and aggregate requests', async () => {
			mockCountResponse();

			const filter = { _and: [{ metadata: { _json: { rating: { _gte: '4' } } } }] };

			useItems(ref('test_collection'), {
				fields: ref(['id']),
				limit: ref(25),
				sort: ref(['id']),
				search: ref<string | null>(null),
				filter: ref<Filter | null>(filter),
				page: ref(1),
			});

			await flushPromises();

			const { itemFilter, aggregateFilters } = getRequestFilters();

			expect(itemFilter).toBe(JSON.stringify(filter));
			expect(aggregateFilters.length).toBeGreaterThan(0);
			for (const aggregateFilter of aggregateFilters) expect(aggregateFilter).toBe(JSON.stringify(filter));
		});
	});
});
