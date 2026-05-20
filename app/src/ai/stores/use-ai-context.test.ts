import { createTestingPinia } from '@pinia/testing';
import type { Relation } from '@directus/types';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { PendingContextItem } from '../types';
import { MAX_PENDING_CONTEXT, useAiContextStore } from './use-ai-context';
import api from '@/api';
import sdk from '@/sdk';
import { useCollectionsStore } from '@/stores/collections';
import { useRelationsStore } from '@/stores/relations';
import { unexpectedError } from '@/utils/unexpected-error';

vi.mock('@/api', () => ({
	default: {
		get: vi.fn(),
		post: vi.fn(),
	},
}));

vi.mock('@/sdk', async () => {
	const { mockSdk } = await import('@/test-utils/sdk');
	return mockSdk();
});

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);

	vi.clearAllMocks();
});

const createVisualElement = (key: string): PendingContextItem => ({
	id: key,
	type: 'visual-element',
	data: {
		collection: 'posts',
		item: '1',
		key,
		fields: ['title'],
	},
	display: `Post ${key}`,
});

function createParentedVisualElement(options: {
	collection: string;
	item: string | number;
	parentCollection: string;
}): PendingContextItem {
	return {
		id: `${options.collection}-${options.item}`,
		type: 'visual-element',
		data: {
			collection: options.collection,
			item: options.item,
			key: `${options.collection}-${options.item}`,
			fields: ['title'],
			version: 'draft',
			parent: {
				collection: options.parentCollection,
				item: 1,
				version: 'draft',
			},
		},
		display: `${options.collection} ${options.item}`,
	};
}

const createItemContext = (id: string, itemId: string = '1'): PendingContextItem => ({
	id,
	type: 'item',
	data: {
		collection: 'posts',
		key: itemId,
	},
	display: `Item ${id}`,
});

const createPromptContext = (id: string): PendingContextItem => ({
	id,
	type: 'prompt',
	data: {
		text: 'Test prompt',
		prompt: { id: '1', name: 'test', status: 'published' },
		values: {},
	},
	display: `Prompt ${id}`,
});

function setupSchema(collections: ReturnType<typeof collection>[], relations: Relation[]) {
	useCollectionsStore().collections = collections;
	useRelationsStore().relations = relations;
}

function collection(collection: string, versioning: boolean) {
	return {
		collection,
		name: collection,
		type: 'table',
		meta: { versioning },
		schema: {},
	} as any;
}

function relation(
	collection: string,
	field: string,
	relatedCollection: string | null,
	options: {
		oneField?: string | null;
		junctionField?: string | null;
		oneCollectionField?: string | null;
		oneAllowedCollections?: string[] | null;
	} = {},
): Relation {
	return {
		collection,
		field,
		related_collection: relatedCollection,
		schema: null,
		meta: {
			id: 1,
			many_collection: collection,
			many_field: field,
			one_collection: relatedCollection,
			one_field: options.oneField ?? null,
			one_collection_field: options.oneCollectionField ?? null,
			one_allowed_collections: options.oneAllowedCollections ?? null,
			one_deselect_action: 'nullify',
			junction_field: options.junctionField ?? null,
			sort_field: null,
		},
	};
}

describe('useAiContextStore', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('addPendingContext', () => {
		test('adds item to pendingContext', () => {
			const store = useAiContextStore();
			const item = createItemContext('1');

			const result = store.addPendingContext(item);

			expect(result).toBe(true);
			expect(store.pendingContext).toHaveLength(1);
			expect(store.pendingContext[0]).toStrictEqual(item);
		});

		test('enforces MAX_PENDING_CONTEXT across all types', () => {
			const store = useAiContextStore();

			// Add a mix of types up to the limit
			for (let i = 0; i < MAX_PENDING_CONTEXT - 2; i++) {
				const result = store.addPendingContext(createVisualElement(`key-${i}`));
				expect(result).toBe(true);
			}

			expect(store.addPendingContext(createItemContext('item-1'))).toBe(true);
			expect(store.addPendingContext(createPromptContext('prompt-1'))).toBe(true);
			expect(store.pendingContext).toHaveLength(MAX_PENDING_CONTEXT);

			// All types should be rejected when at cap
			expect(store.addPendingContext(createVisualElement('key-overflow'))).toBe(false);
			expect(store.addPendingContext(createItemContext('item-overflow'))).toBe(false);
			expect(store.addPendingContext(createPromptContext('prompt-overflow'))).toBe(false);
			expect(store.pendingContext).toHaveLength(MAX_PENDING_CONTEXT);
		});
	});

	describe('removePendingContext', () => {
		test('removes item by id', () => {
			const store = useAiContextStore();

			store.addPendingContext(createItemContext('1'));
			store.addPendingContext(createItemContext('2'));

			store.removePendingContext('1');

			expect(store.pendingContext).toHaveLength(1);
			expect(store.pendingContext[0]!.id).toBe('2');
		});

		test('no-op if id not found', () => {
			const store = useAiContextStore();

			store.addPendingContext(createItemContext('1'));
			store.removePendingContext('nonexistent');

			expect(store.pendingContext).toHaveLength(1);
		});
	});

	describe('clearPendingContext', () => {
		test('clears all items', () => {
			const store = useAiContextStore();

			store.addPendingContext(createVisualElement('1'));
			store.addPendingContext(createItemContext('2'));
			store.addPendingContext(createPromptContext('3'));

			store.clearPendingContext();

			expect(store.pendingContext).toHaveLength(0);
		});
	});

	describe('clearNonVisualContext', () => {
		test('keeps only visual elements', () => {
			const store = useAiContextStore();

			store.addPendingContext(createVisualElement('visual-1'));
			store.addPendingContext(createItemContext('item-1'));
			store.addPendingContext(createPromptContext('prompt-1'));
			store.addPendingContext(createVisualElement('visual-2'));

			store.clearNonVisualContext();

			expect(store.pendingContext).toHaveLength(2);
			expect(store.pendingContext.every((item) => item.type === 'visual-element')).toBe(true);
		});
	});

	describe('syncVisualElementContextUrl', () => {
		test('sets URL', () => {
			const store = useAiContextStore();

			store.syncVisualElementContextUrl('/admin/visual/posts');

			expect(store.visualElementContextUrl).toBe('/admin/visual/posts');
		});

		test('clears visual context on URL change', () => {
			const store = useAiContextStore();

			store.syncVisualElementContextUrl('/admin/visual/posts');
			store.addPendingContext(createVisualElement('1'));
			store.addPendingContext(createItemContext('item-1'));

			// Change URL
			store.syncVisualElementContextUrl('/admin/visual/pages');

			// Visual elements cleared, items remain
			expect(store.visualElements).toHaveLength(0);
			expect(store.pendingContext).toHaveLength(1);
			expect(store.pendingContext[0]!.type).toBe('item');
		});

		test('does not clear on same URL', () => {
			const store = useAiContextStore();

			store.syncVisualElementContextUrl('/admin/visual/posts');
			store.addPendingContext(createVisualElement('1'));

			store.syncVisualElementContextUrl('/admin/visual/posts');

			expect(store.visualElements).toHaveLength(1);
		});
	});

	describe('fetchContextData', () => {
		test('fetches current values for visual elements', async () => {
			const store = useAiContextStore();
			vi.mocked(sdk.request).mockResolvedValue({ title: 'Fetched Title' });
			const sdkSpy = vi.spyOn(sdk, 'request');

			store.addPendingContext(createVisualElement('1'));

			const attachments = await store.fetchContextData();

			expect(sdkSpy.mock.calls[0]?.[0]()).toEqual({
				path: '/items/posts/1',
				params: { fields: ['title'] },
			});

			expect(attachments).toHaveLength(1);
			expect(attachments[0]!.type).toBe('visual-element');
			expect(attachments[0]!.snapshot).toEqual({ title: 'Fetched Title' });
		});

		test('fetches O2M visual elements through the parent version', async () => {
			const store = useAiContextStore();
			setupSchema(
				[collection('articles', true), collection('article_translations', false)],
				[relation('article_translations', 'article_id', 'articles', { oneField: 'translations' })],
			);

			vi.mocked(sdk.request)
				.mockResolvedValueOnce({ translations: [{ id: 5 }] })
				.mockResolvedValueOnce({ translations: [{ id: 5, title: 'Draft title' }] });

			store.addPendingContext(
				createParentedVisualElement({
					collection: 'article_translations',
					item: 5,
					parentCollection: 'articles',
				}),
			);

			const attachments = await store.fetchContextData();

			expect(attachments[0]!.snapshot).toEqual({ id: 5, title: 'Draft title' });
			expect(vi.mocked(sdk.request).mock.calls[1]?.[0]()).toEqual({
				path: '/items/articles/1',
				params: { fields: ['translations.id', 'translations.title'], version: 'draft' },
			});
		});

		test('fetches M2M visual elements through the parent version', async () => {
			const store = useAiContextStore();
			setupSchema(
				[collection('articles', true), collection('articles_tags', false), collection('tags', false)],
				[
					relation('articles_tags', 'articles_id', 'articles', { oneField: 'tags', junctionField: 'tags_id' }),
					relation('articles_tags', 'tags_id', 'tags'),
				],
			);

			vi.mocked(sdk.request)
				.mockResolvedValueOnce({ tags: [{ id: 12, tags_id: { id: 5 } }] })
				.mockResolvedValueOnce({ tags: [{ id: 12, tags_id: { id: 5, title: 'Draft tag' } }] });

			store.addPendingContext(
				createParentedVisualElement({
					collection: 'tags',
					item: 5,
					parentCollection: 'articles',
				}),
			);

			const attachments = await store.fetchContextData();

			expect(attachments[0]!.snapshot).toEqual({ id: 5, title: 'Draft tag' });
			expect(vi.mocked(sdk.request).mock.calls[1]?.[0]()).toEqual({
				path: '/items/articles/1',
				params: { fields: ['tags.id', 'tags.tags_id.id', 'tags.tags_id.title'], version: 'draft' },
			});
		});

		test('fetches M2A visual elements through the parent version', async () => {
			const store = useAiContextStore();
			setupSchema(
				[collection('pages', true), collection('pages_blocks', false), collection('block_hero', false)],
				[
					relation('pages_blocks', 'pages_id', 'pages', { oneField: 'blocks', junctionField: 'item' }),
					relation('pages_blocks', 'item', null, {
						oneCollectionField: 'collection',
						oneAllowedCollections: ['block_hero'],
					}),
				],
			);

			const parent = {
				blocks: [{ id: 7, collection: 'block_hero', item: { id: 9, title: 'Draft block' } }],
			};

			vi.mocked(sdk.request).mockResolvedValueOnce(parent).mockResolvedValueOnce(parent);

			store.addPendingContext(
				createParentedVisualElement({
					collection: 'block_hero',
					item: 9,
					parentCollection: 'pages',
				}),
			);

			const attachments = await store.fetchContextData();

			expect(attachments[0]!.snapshot).toEqual({ id: 9, title: 'Draft block' });
			expect(vi.mocked(sdk.request).mock.calls[1]?.[0]()).toEqual({
				path: '/items/pages/1',
				params: {
					fields: ['blocks.id', 'blocks.item.id', 'blocks.item.title', 'blocks.collection'],
					version: 'draft',
				},
			});
		});

		test('fetches M2O visual elements through the parent version', async () => {
			const store = useAiContextStore();
			setupSchema([collection('pages', true), collection('seo', false)], [relation('pages', 'seo', 'seo')]);

			vi.mocked(sdk.request)
				.mockResolvedValueOnce({ seo: { id: 4 } })
				.mockResolvedValueOnce({ seo: { id: 4, title: 'Draft SEO' } });

			store.addPendingContext(
				createParentedVisualElement({
					collection: 'seo',
					item: 4,
					parentCollection: 'pages',
				}),
			);

			const attachments = await store.fetchContextData();

			expect(attachments[0]!.snapshot).toEqual({ id: 4, title: 'Draft SEO' });
			expect(vi.mocked(sdk.request).mock.calls[1]?.[0]()).toEqual({
				path: '/items/pages/1',
				params: { fields: ['seo.id', 'seo.title'], version: 'draft' },
			});
		});

		test('uses wildcard fields when none specified', async () => {
			const store = useAiContextStore();
			vi.mocked(sdk.request).mockResolvedValue({ id: 1 });
			const sdkSpy = vi.spyOn(sdk, 'request');

			const element: PendingContextItem = {
				id: '1',
				type: 'visual-element',
				data: { collection: 'posts', item: '1', key: '1', fields: [] },
				display: 'Post',
			};

			store.addPendingContext(element);
			await store.fetchContextData();

			expect(sdkSpy.mock.calls[0]?.[0]()).toEqual({ path: '/items/posts/1', params: { fields: ['*'] } });
		});

		test('handles API errors gracefully', async () => {
			const store = useAiContextStore();
			const error = new Error('API Error');
			vi.mocked(sdk.request).mockRejectedValue(error);

			store.addPendingContext(createVisualElement('1'));

			const attachments = await store.fetchContextData();

			expect(unexpectedError).toHaveBeenCalledWith(error);
			expect(attachments).toHaveLength(0);
		});

		test('fetches item context from API', async () => {
			const store = useAiContextStore();
			vi.mocked(sdk.request).mockResolvedValue({ id: '1', title: 'Fetched' });
			const sdkSpy = vi.spyOn(sdk, 'request');

			store.addPendingContext(createItemContext('1'));

			const attachments = await store.fetchContextData();

			expect(sdkSpy.mock.calls[0]?.[0]()).toEqual({ path: '/items/posts/1', params: { fields: ['*'] } });
			expect(attachments).toHaveLength(1);
			expect(attachments[0]!.type).toBe('item');
			expect(attachments[0]!.snapshot).toEqual({ id: '1', title: 'Fetched' });
		});

		test('converts prompt context to attachment', async () => {
			const store = useAiContextStore();

			store.addPendingContext(createPromptContext('1'));

			const attachments = await store.fetchContextData();

			expect(attachments).toHaveLength(1);
			expect(attachments[0]!.type).toBe('prompt');
			expect(attachments[0]!.snapshot).toEqual({ text: 'Test prompt' });
		});

		test('handles item context fetch failure gracefully', async () => {
			const store = useAiContextStore();
			const error = new Error('Item not found');
			vi.mocked(sdk.request).mockRejectedValue(error);

			store.addPendingContext(createItemContext('1'));

			const attachments = await store.fetchContextData();

			expect(unexpectedError).toHaveBeenCalledWith(error);
			expect(attachments).toHaveLength(0);
		});

		test('returns partial results when one item fails', async () => {
			const store = useAiContextStore();

			vi.mocked(sdk.request)
				.mockResolvedValueOnce({ id: '1', title: 'Success' })
				.mockRejectedValueOnce(new Error('Failed'));

			store.addPendingContext(createItemContext('ctx-1', '1'));
			store.addPendingContext(createItemContext('ctx-2', '2'));

			const attachments = await store.fetchContextData();

			expect(unexpectedError).toHaveBeenCalled();
			expect(attachments).toHaveLength(1);
			expect(attachments[0]!.snapshot).toEqual({ id: '1', title: 'Success' });
		});
	});

	describe('uploadPendingFiles', () => {
		test('returns empty array when provider is missing', async () => {
			const store = useAiContextStore();
			const results = await store.uploadPendingFiles();

			expect(results).toEqual([]);
		});

		test('uploads local non-image files without creating preview URLs', async () => {
			const store = useAiContextStore();

			store.addPendingContext({
				id: 'local-file',
				type: 'local-file',
				data: { file: new File(['test'], 'test.txt', { type: 'text/plain' }) },
				display: 'test.txt',
			});

			vi.mocked(api.post).mockResolvedValue({
				data: {
					provider: 'openai',
					fileId: 'file-1',
					filename: 'test.txt',
					mimeType: 'text/plain',
					sizeBytes: 4,
					expiresAt: null,
				},
			});

			const results = await store.uploadPendingFiles('openai');

			expect(results).toHaveLength(1);
			expect(results[0]!.displayUrl).toBe('');
			expect(api.post).toHaveBeenCalledWith('/ai/files', expect.any(FormData));
		});

		test('drops failed uploads and reports errors for partial failures', async () => {
			const store = useAiContextStore();

			for (let i = 1; i <= 3; i++) {
				store.addPendingContext({
					id: `local-file-${i}`,
					type: 'local-file',
					data: { file: new File([`content-${i}`], `file-${i}.txt`, { type: 'text/plain' }) },
					display: `file-${i}.txt`,
				});
			}

			vi.mocked(api.post)
				.mockResolvedValueOnce({
					data: {
						provider: 'openai',
						fileId: 'file-1',
						filename: 'file-1.txt',
						mimeType: 'text/plain',
						sizeBytes: 9,
						expiresAt: null,
					},
				})
				.mockRejectedValueOnce(new Error('500'))
				.mockResolvedValueOnce({
					data: {
						provider: 'openai',
						fileId: 'file-3',
						filename: 'file-3.txt',
						mimeType: 'text/plain',
						sizeBytes: 9,
						expiresAt: null,
					},
				});

			const results = await store.uploadPendingFiles('openai');

			expect(results).toHaveLength(2);
			expect(unexpectedError).toHaveBeenCalledOnce();
		});

		test('uses asset URLs for staged library files', async () => {
			const store = useAiContextStore();

			store.addPendingContext({
				id: 'file',
				type: 'file',
				data: {
					id: 'abc123',
					filename_download: 'doc.pdf',
					type: 'application/pdf',
					title: 'Document',
				},
				display: 'Document',
			});

			vi.mocked(api.get).mockResolvedValue({
				data: new Blob(['pdf']),
			});

			vi.mocked(api.post).mockResolvedValue({
				data: {
					provider: 'openai',
					fileId: 'file-2',
					filename: 'doc.pdf',
					mimeType: 'application/pdf',
					sizeBytes: 3,
					expiresAt: null,
				},
			});

			const results = await store.uploadPendingFiles('openai');

			expect(results).toHaveLength(1);
			expect(results[0]!.displayUrl).toBe('/assets/abc123');
		});
	});

	describe('computed properties', () => {
		test('visualElements filters to only visual elements', () => {
			const store = useAiContextStore();

			store.addPendingContext(createVisualElement('1'));
			store.addPendingContext(createItemContext('2'));

			expect(store.visualElements).toHaveLength(1);
			expect(store.visualElements[0]!.type).toBe('visual-element');
		});

		test('hasVisualElementContext', () => {
			const store = useAiContextStore();

			expect(store.hasVisualElementContext).toBe(false);

			store.addPendingContext(createVisualElement('1'));

			expect(store.hasVisualElementContext).toBe(true);
		});

		test('hasPendingContext', () => {
			const store = useAiContextStore();

			expect(store.hasPendingContext).toBe(false);

			store.addPendingContext(createItemContext('1'));

			expect(store.hasPendingContext).toBe(true);
		});
	});

	describe('dehydrate', () => {
		test('clears pendingContext and visualElementContextUrl', () => {
			const store = useAiContextStore();

			store.syncVisualElementContextUrl('/admin/visual/posts');
			store.addPendingContext(createVisualElement('1'));
			store.addPendingContext(createItemContext('2'));

			store.dehydrate();

			expect(store.pendingContext).toHaveLength(0);
			expect(store.visualElementContextUrl).toBeNull();
		});
	});
});
