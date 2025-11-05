import type { Field, Filter } from '@directus/types';
import { flushPromises } from '@vue/test-utils';
import type { AxiosRequestConfig } from 'axios';
import { isEqual } from 'lodash-es';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { computed, ref, unref } from 'vue';
import { useCollection } from './use-collection.js';
import { useItems } from './use-items.js';

const mockData = { id: 1 };
const mockCountData = { count: 2 };
const mockCountDistinctData = { countDistinct: { id: 3 } };

const mockPrimaryKeyField: Field = {
	collection: 'test_collection',
	field: 'id',
	name: 'id',
	type: 'integer',
	schema: null,
	meta: null,
};

const mockApiGet = vi.fn();
const mockApiPost = vi.fn();

function isGetItemsRequest(config: AxiosRequestConfig) {
	if (!config.params) return false;
	return Object.keys(config.params).includes('fields');
}

function isTotalCountRequest(config: AxiosRequestConfig) {
	if (!config.params) return false;
	return isEqual(Object.keys(config.params), ['aggregate', 'filter']);
}

function isFilterCountRequest(config: AxiosRequestConfig) {
	if (!config.params) return false;
	return isEqual(Object.keys(config.params), ['filter', 'search', 'aggregate']);
}

vi.mock('./use-system.js', () => ({
	useApi: vi.fn().mockImplementation(() => ({
		get: mockApiGet.mockImplementation((_path: string, config: AxiosRequestConfig) => {
			if (isTotalCountRequest(config) || isFilterCountRequest(config)) {
				if (config.params.aggregate?.countDistinct) return Promise.resolve({ data: { data: [mockCountDistinctData] } });
				return Promise.resolve({ data: { data: [mockCountData] } });
			}

			return Promise.resolve({ data: { data: [mockData] } });
		}),
		post: mockApiPost,
	})),
}));

vi.mock('./use-collection.js');

beforeEach(() => {
	// use fake timers to control debounce timing
	vi.useFakeTimers();
});

afterEach(() => {
	vi.clearAllMocks();
});

test('should fetch filter count and total count only once', async () => {
	vi.mocked(useCollection).mockReturnValueOnce({ primaryKeyField: computed(() => null) } as any);

	const { totalCount, itemCount } = useItems(ref('test_collection'), {
		fields: ref(['*']),
		limit: ref(1),
		sort: ref(null),
		search: ref(null),
		filter: ref(null),
		page: ref(1),
	});

	// advance timers past debounce delay
	await vi.advanceTimersByTimeAsync(350);

	expect(unref(totalCount)).toBe(mockCountData.count);
	expect(unref(itemCount)).toBe(mockCountData.count);
	expect(mockApiGet.mock.calls.filter((call) => isGetItemsRequest(call[1])).length).toBe(1);
	expect(mockApiGet.mock.calls.filter((call) => isTotalCountRequest(call[1])).length).toBe(1);
	expect(mockApiGet.mock.calls.filter((call) => isFilterCountRequest(call[1])).length).toBe(1);
});

test('should fetch distinct filter count and total count only once', async () => {
	vi.mocked(useCollection).mockReturnValueOnce({ primaryKeyField: computed(() => mockPrimaryKeyField) } as any);

	const { totalCount, itemCount } = useItems(ref('test_collection'), {
		fields: ref(['*']),
		limit: ref(1),
		sort: ref(null),
		search: ref(null),
		filter: ref(null),
		page: ref(1),
	});

	// advance timers past debounce delay
	await vi.advanceTimersByTimeAsync(350);

	expect(unref(totalCount)).toBe(mockCountDistinctData.countDistinct.id);
	expect(unref(itemCount)).toBe(mockCountDistinctData.countDistinct.id);
	expect(mockApiGet.mock.calls.filter((call) => isGetItemsRequest(call[1])).length).toBe(1);
	expect(mockApiGet.mock.calls.filter((call) => isTotalCountRequest(call[1])).length).toBe(1);
	expect(mockApiGet.mock.calls.filter((call) => isFilterCountRequest(call[1])).length).toBe(1);
});

test('should not re-fetch filter count when changing fields query', async () => {
	vi.mocked(useCollection).mockReturnValueOnce({ primaryKeyField: computed(() => null) } as any);

	const fields = ref(['*']);

	useItems(ref('test_collection'), {
		fields,
		limit: ref(1),
		sort: ref(null),
		search: ref(null),
		filter: ref(null),
		page: ref(1),
	});

	// advance timers for initial fetch
	await vi.advanceTimersByTimeAsync(350);

	// update fields query
	fields.value = ['id'];

	// advance timers for second fetch
	await vi.advanceTimersByTimeAsync(350);

	expect(mockApiGet.mock.calls.filter((call) => isFilterCountRequest(call[1])).length).toBe(1);
});

test('should re-fetch filter count when changing filters query', async () => {
	vi.mocked(useCollection).mockReturnValueOnce({ primaryKeyField: computed(() => null) } as any);

	const filter = ref<Filter | null>(null);

	useItems(ref('test_collection'), {
		fields: ref(['*']),
		limit: ref(1),
		sort: ref(null),
		search: ref(null),
		filter,
		page: ref(1),
	});

	// advance timers for initial fetch
	await vi.advanceTimersByTimeAsync(350);

	// update filter query
	filter.value = { id: { _eq: 1 } };

	// advance timers for second fetch
	await vi.advanceTimersByTimeAsync(350);

	expect(mockApiGet.mock.calls.filter((call) => isTotalCountRequest(call[1])).length).toBe(1);
	expect(mockApiGet.mock.calls.filter((call) => isFilterCountRequest(call[1])).length).toBe(2);
});

test('should re-fetch total count when changing system filter', async () => {
	vi.mocked(useCollection).mockReturnValueOnce({ primaryKeyField: computed(() => null) } as any);

	const filterSystem = ref<Filter | null>(null);

	useItems(ref('test_collection'), {
		fields: ref(['*']),
		limit: ref(1),
		sort: ref(null),
		search: ref(null),
		filter: ref(null),
		filterSystem,
		page: ref(1),
	});

	// advance timers for initial fetch
	await vi.advanceTimersByTimeAsync(350);

	// update filter query
	filterSystem.value = { id: { _eq: 1 } };

	// system filter change is not debounced, just flush promises
	await flushPromises();

	expect(mockApiGet.mock.calls.filter((call) => isFilterCountRequest(call[1])).length).toBe(1);
	expect(mockApiGet.mock.calls.filter((call) => isTotalCountRequest(call[1])).length).toBe(2);
});

test('should re-fetch filter count when changing search query', async () => {
	vi.mocked(useCollection).mockReturnValueOnce({ primaryKeyField: computed(() => null) } as any);

	const search = ref<string | null>(null);

	useItems(ref('test_collection'), {
		fields: ref(['*']),
		limit: ref(1),
		sort: ref(null),
		search,
		filter: ref(null),
		page: ref(1),
	});

	// advance timers for initial fetch
	await vi.advanceTimersByTimeAsync(350);

	// update search query
	search.value = 'test';

	// advance timers for second fetch
	await vi.advanceTimersByTimeAsync(350);

	expect(mockApiGet.mock.calls.filter((call) => isTotalCountRequest(call[1])).length).toBe(1);
	expect(mockApiGet.mock.calls.filter((call) => isFilterCountRequest(call[1])).length).toBe(2);
});

test('should reset when collection changes', async () => {
	vi.mocked(useCollection).mockReturnValueOnce({ primaryKeyField: computed(() => null) } as any);

	const collection = ref('old_collection');

	const { items } = useItems(collection, {
		fields: ref(['*']),
		limit: ref(1),
		sort: ref(null),
		search: ref(null),
		filter: ref(null),
		page: ref(1),
	});

	// Wait until computed values are updated
	await flushPromises();
	// advance timers for initial fetch
	await vi.advanceTimersByTimeAsync(350);

	expect(unref(items)).toEqual([mockData]);

	// update collection ref
	collection.value = 'new_collection';

	// Wait until computed values are updated again
	await flushPromises();

	expect(unref(items)).toEqual([]);

	// advance timers for second fetch
	await vi.advanceTimersByTimeAsync(350);

	expect(mockApiGet.mock.calls.filter((call) => isTotalCountRequest(call[1])).length).toBe(2);
	expect(mockApiGet.mock.calls.filter((call) => isFilterCountRequest(call[1])).length).toBe(2);
});

test('should append $thumbnail to fetched items when collection is directus_files', async () => {
	vi.mocked(useCollection).mockReturnValueOnce({ primaryKeyField: computed(() => null) } as any);

	const collection = ref('directus_files');

	const { items } = useItems(collection, {
		fields: ref(['*']),
		limit: ref(1),
		sort: ref(null),
		search: ref(null),
		filter: ref(null),
		page: ref(1),
	});

	// advance timers past debounce delay
	await vi.advanceTimersByTimeAsync(350);

	expect(unref(items)).toEqual([{ id: mockData.id, $thumbnail: mockData }]);
});
