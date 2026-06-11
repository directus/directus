import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';
import { useGlobalSearch } from './use-global-search';

const post = vi.fn();

vi.mock('@directus/composables', () => ({
	useApi: () => ({
		post,
	}),
}));

function setupSearch() {
	const pinia = createTestingPinia({
		createSpy: vi.fn,
		stubActions: false,
		initialState: {
			settingsStore: {
				settings: {
					global_search_config: {
						triggerRate: 150,
						collections: [
							{
								collection: 'articles',
								displayTemplate: '{{title}}',
								descriptionField: 'summary',
								fields: ['title'],
							},
						],
					},
				},
			},
			collectionsStore: {
				collections: [
					{
						collection: 'articles',
						name: 'Articles',
						icon: 'article',
						meta: {
							icon: 'article',
							display_template: '{{title}}',
						},
					},
				],
			},
			fieldsStore: {
				fields: [
					{
						collection: 'articles',
						field: 'id',
						schema: {
							is_primary_key: true,
						},
					},
				],
			},
		},
	});

	const search = ref('');
	let globalSearch!: ReturnType<typeof useGlobalSearch>;

	mount(
		defineComponent({
			setup() {
				globalSearch = useGlobalSearch(search);
				return {};
			},
			template: '<div />',
		}),
		{
			global: {
				plugins: [pinia],
			},
		},
	);

	return {
		search,
		...globalSearch,
	};
}

describe('useGlobalSearch', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		post.mockReset();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	test('requests global search results from the global search endpoint', async () => {
		post.mockResolvedValue({
			data: {
				data: {
					articles: [{ id: 1, title: 'Alpha', summary: 'Published article' }],
				},
			},
		});

		const { search, results } = setupSearch();

		search.value = 'al';
		await nextTick();
		await vi.advanceTimersByTimeAsync(150);
		await flushPromises();

		expect(post).toHaveBeenCalledWith('/utils/global-search', { query: 'al' });

		expect(results.value[0]?.items[0]).toMatchObject({
			collection: 'articles',
			pk: '1',
			displayValue: 'Alpha',
			descriptionValue: 'Published article',
		});
	});

	test('does not request global search below the minimum query length', async () => {
		const { search, loading, results } = setupSearch();

		search.value = 'a';
		await nextTick();
		await vi.advanceTimersByTimeAsync(150);
		await flushPromises();

		expect(post).not.toHaveBeenCalled();
		expect(loading.value).toBe(false);
		expect(results.value).toEqual([]);
	});

	test('ignores stale responses from older searches', async () => {
		const firstResponse = Promise.resolve({
			data: {
				data: {
					articles: [{ id: 1, title: 'Old', summary: 'Old result' }],
				},
			},
		});

		const secondResponse = Promise.resolve({
			data: {
				data: {
					articles: [{ id: 2, title: 'New', summary: 'New result' }],
				},
			},
		});

		post.mockReturnValueOnce(firstResponse).mockReturnValueOnce(secondResponse);

		const { search, results } = setupSearch();

		search.value = 'ol';
		await nextTick();
		await vi.advanceTimersByTimeAsync(150);

		search.value = 'ne';
		await nextTick();
		await vi.advanceTimersByTimeAsync(150);
		await flushPromises();

		expect(results.value[0]?.items).toEqual([
			expect.objectContaining({
				pk: '2',
				displayValue: 'New',
			}),
		]);
	});
});
