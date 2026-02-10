import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { PendingContextItem } from '../types';
import { MAX_PENDING_CONTEXT, useAiContextStore } from './use-ai-context';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';

vi.mock('@/api', () => ({
	default: {
		get: vi.fn(),
	},
}));

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

describe('useAiContextStore', () => {
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
			vi.mocked(api.get).mockResolvedValue({ data: { data: { title: 'Fetched Title' } } });

			store.addPendingContext(createVisualElement('1'));

			const attachments = await store.fetchContextData();

			expect(api.get).toHaveBeenCalledWith('/items/posts/1', { params: { fields: ['title'] } });
			expect(attachments).toHaveLength(1);
			expect(attachments[0]!.type).toBe('visual-element');
			expect(attachments[0]!.snapshot).toEqual({ title: 'Fetched Title' });
		});

		test('uses wildcard fields when none specified', async () => {
			const store = useAiContextStore();
			vi.mocked(api.get).mockResolvedValue({ data: { data: { id: 1 } } });

			const element: PendingContextItem = {
				id: '1',
				type: 'visual-element',
				data: { collection: 'posts', item: '1', key: '1', fields: [] },
				display: 'Post',
			};

			store.addPendingContext(element);
			await store.fetchContextData();

			expect(api.get).toHaveBeenCalledWith('/items/posts/1', { params: { fields: ['*'] } });
		});

		test('handles API errors gracefully', async () => {
			const store = useAiContextStore();
			const error = new Error('API Error');
			vi.mocked(api.get).mockRejectedValue(error);

			store.addPendingContext(createVisualElement('1'));

			const attachments = await store.fetchContextData();

			expect(unexpectedError).toHaveBeenCalledWith(error);
			expect(attachments).toHaveLength(0);
		});

		test('fetches item context from API', async () => {
			const store = useAiContextStore();
			vi.mocked(api.get).mockResolvedValue({ data: { data: { id: '1', title: 'Fetched' } } });

			store.addPendingContext(createItemContext('1'));

			const attachments = await store.fetchContextData();

			expect(api.get).toHaveBeenCalledWith('/items/posts/1', { params: { fields: ['*'] } });
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
			vi.mocked(api.get).mockRejectedValue(error);

			store.addPendingContext(createItemContext('1'));

			const attachments = await store.fetchContextData();

			expect(unexpectedError).toHaveBeenCalledWith(error);
			expect(attachments).toHaveLength(0);
		});

		test('returns partial results when one item fails', async () => {
			const store = useAiContextStore();

			vi.mocked(api.get)
				.mockResolvedValueOnce({ data: { data: { id: '1', title: 'Success' } } })
				.mockRejectedValueOnce(new Error('Failed'));

			store.addPendingContext(createItemContext('ctx-1', '1'));
			store.addPendingContext(createItemContext('ctx-2', '2'));

			const attachments = await store.fetchContextData();

			expect(unexpectedError).toHaveBeenCalled();
			expect(attachments).toHaveLength(1);
			expect(attachments[0]!.snapshot).toEqual({ id: '1', title: 'Success' });
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
