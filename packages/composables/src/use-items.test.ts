import type { Filter } from '@directus/types';
import { flushPromises } from '@vue/test-utils';
import type { AxiosInstance } from 'axios';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { type Ref, ref, unref } from 'vue';
import { useItems } from './use-items.js';
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

		// Should only call once immediately (items, total)
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

		// Should only call once immediately (items, total)
		expect(mockApiGet).toHaveBeenCalledTimes(2);

		// Trigger multiple rapid changes
		query.search.value = 'test1';
		query.search.value = 'test2';
		query.search.value = 'test3';

		// Fast-forward past throttle delay (500ms)
		await vi.advanceTimersByTimeAsync(500);

		// Should have been called once due to throttle (items(2), count(1), total(1))
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

		// Should only call once immediately (items, total)
		expect(mockApiGet).toHaveBeenCalledTimes(2);

		// First change
		query.search.value = 'first';
		await vi.advanceTimersByTimeAsync(500);
		// Should have been called once due to throttle (items(2), count(1), total(1))
		expect(mockApiGet).toHaveBeenCalledTimes(4);

		// Wait for throttle to reset
		await vi.advanceTimersByTimeAsync(100);

		// Second change after throttle period
		query.search.value = 'second';
		await vi.advanceTimersByTimeAsync(500);
		// Should have been called once due to throttle (items(3), count(2), total(1))
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

		// Should only call once immediately (items, total)
		expect(mockApiGet).toHaveBeenCalledTimes(2);

		limit.value = 5;

		// Fast-forward past throttle delay (500ms)
		await vi.advanceTimersByTimeAsync(500);

		// Should have been called once due to throttle (items(2), total(1))
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

	test('should deduplicate concurrent getTotalCount requests', async () => {
		const collection = ref('test_collection');

		mockApiGet = vi.fn().mockResolvedValue({
			data: {
				data: [
					{
						count: 10,
						countDistinct: { id: 10 },
					},
				],
			},
		});

		const { getTotalCount } = useItems(collection, {
			fields: ref(['id']),
			limit: ref(25),
			sort: ref(['id']),
			search: ref(''),
			filter: ref({}),
			page: ref(1),
		});

		const p1 = getTotalCount();
		const p2 = getTotalCount();

		await Promise.all([p1, p2]);

		const totalRequests = vi
			.mocked(mockApiGet)
			.mock.calls.filter(
				(call) => call[1]?.params?.aggregate?.count === '*' || call[1]?.params?.aggregate?.countDistinct,
			);

		expect(totalRequests.length).toBe(1);
	});

	test('should reuse totalCount for itemCount when filters match system filters', async () => {
		const collection = ref('test_collection');

		mockApiGet = vi.fn().mockResolvedValue({
			data: {
				data: [
					{
						count: 10,
						countDistinct: { id: 10 },
					},
				],
			},
		});

		const { itemCount, totalCount, getItemCount } = useItems(collection, {
			fields: ref(['id']),
			limit: ref(25),
			sort: ref(['id']),
			search: ref(''),
			filter: ref({}),
			page: ref(1),
		});

		await flushPromises();

		totalCount.value = 100;

		vi.mocked(mockApiGet).mockClear();

		await getItemCount();

		expect(itemCount.value).toBe(100);
		expect(mockApiGet).not.toHaveBeenCalled();
	});
});
