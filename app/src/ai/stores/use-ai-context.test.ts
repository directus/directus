import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { PendingContextItem } from '../types';
import { MAX_PENDING_CONTEXT, useAiContextStore } from './use-ai-context';

vi.mock('@/api', () => ({
	default: {
		get: vi.fn(),
	},
}));

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';

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

const createItemContext = (id: string): PendingContextItem => ({
	id,
	type: 'item',
	data: {
		collection: 'posts',
		id: '1',
		itemData: { title: 'Test' },
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

		test('enforces MAX_PENDING_CONTEXT for visual elements', () => {
			const store = useAiContextStore();

			// Add MAX_PENDING_CONTEXT visual elements
			for (let i = 0; i < MAX_PENDING_CONTEXT; i++) {
				const result = store.addPendingContext(createVisualElement(`key-${i}`));
				expect(result).toBe(true);
			}

			expect(store.pendingContext).toHaveLength(MAX_PENDING_CONTEXT);

			// Try to add one more visual element
			const result = store.addPendingContext(createVisualElement('key-overflow'));
			expect(result).toBe(false);
			expect(store.pendingContext).toHaveLength(MAX_PENDING_CONTEXT);
		});

		test('does not enforce limit for non-visual elements', () => {
			const store = useAiContextStore();

			// Fill with visual elements
			for (let i = 0; i < MAX_PENDING_CONTEXT; i++) {
				store.addPendingContext(createVisualElement(`key-${i}`));
			}

			// Can still add item and prompt context
			const itemResult = store.addPendingContext(createItemContext('item-1'));
			const promptResult = store.addPendingContext(createPromptContext('prompt-1'));

			expect(itemResult).toBe(true);
			expect(promptResult).toBe(true);
			expect(store.pendingContext).toHaveLength(MAX_PENDING_CONTEXT + 2);
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

	describe('setVisualElementContextUrl', () => {
		test('sets URL', () => {
			const store = useAiContextStore();

			store.setVisualElementContextUrl('/admin/visual/posts');

			expect(store.visualElementContextUrl).toBe('/admin/visual/posts');
		});

		test('clears visual context on URL change', () => {
			const store = useAiContextStore();

			store.setVisualElementContextUrl('/admin/visual/posts');
			store.addPendingContext(createVisualElement('1'));
			store.addPendingContext(createItemContext('item-1'));

			// Change URL
			store.setVisualElementContextUrl('/admin/visual/pages');

			// Visual elements cleared, items remain
			expect(store.visualElements).toHaveLength(0);
			expect(store.pendingContext).toHaveLength(1);
			expect(store.pendingContext[0]!.type).toBe('item');
		});

		test('does not clear on same URL', () => {
			const store = useAiContextStore();

			store.setVisualElementContextUrl('/admin/visual/posts');
			store.addPendingContext(createVisualElement('1'));

			store.setVisualElementContextUrl('/admin/visual/posts');

			expect(store.visualElements).toHaveLength(1);
		});
	});

	describe('snapshotContext', () => {
		test('fetches current values for visual elements', async () => {
			const store = useAiContextStore();
			vi.mocked(api.get).mockResolvedValue({ data: { data: { title: 'Fetched Title' } } });

			store.addPendingContext(createVisualElement('1'));

			const attachments = await store.snapshotContext();

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
			await store.snapshotContext();

			expect(api.get).toHaveBeenCalledWith('/items/posts/1', { params: { fields: ['*'] } });
		});

		test('handles API errors gracefully', async () => {
			const store = useAiContextStore();
			const error = new Error('API Error');
			vi.mocked(api.get).mockRejectedValue(error);

			store.addPendingContext(createVisualElement('1'));

			const attachments = await store.snapshotContext();

			expect(unexpectedError).toHaveBeenCalledWith(error);
			expect(attachments).toHaveLength(0);
		});

		test('converts item context to attachment', async () => {
			const store = useAiContextStore();

			store.addPendingContext(createItemContext('1'));

			const attachments = await store.snapshotContext();

			expect(attachments).toHaveLength(1);
			expect(attachments[0]!.type).toBe('item');
			expect(attachments[0]!.snapshot).toEqual({ title: 'Test' });
		});

		test('converts prompt context to attachment', async () => {
			const store = useAiContextStore();

			store.addPendingContext(createPromptContext('1'));

			const attachments = await store.snapshotContext();

			expect(attachments).toHaveLength(1);
			expect(attachments[0]!.type).toBe('prompt');
			expect(attachments[0]!.snapshot).toEqual({ text: 'Test prompt' });
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

			store.setVisualElementContextUrl('/admin/visual/posts');
			store.addPendingContext(createVisualElement('1'));
			store.addPendingContext(createItemContext('2'));

			store.dehydrate();

			expect(store.pendingContext).toHaveLength(0);
			expect(store.visualElementContextUrl).toBeNull();
		});
	});
});
