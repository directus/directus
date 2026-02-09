import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useAiStore } from '../stores/use-ai';
import { useAiContextStore } from '../stores/use-ai-context';
import { useContextStaging } from './use-context-staging';
import sdk from '@/sdk';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';

vi.mock('vue-i18n', () => ({
	useI18n: vi.fn(() => ({
		t: vi.fn((key: string) => key),
	})),
	createI18n: () => undefined,
}));

vi.mock('@/sdk', () => ({
	default: {
		request: vi.fn(),
	},
}));

vi.mock('@/utils/notify', () => ({
	notify: vi.fn(),
}));

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

vi.mock('@/utils/render-string-template', () => ({
	renderDisplayStringTemplate: vi.fn((collection, _template, item) => item.title || `${collection} #${item.id}`),
}));

vi.mock('@/utils/adjust-fields-for-displays', () => ({
	adjustFieldsForDisplays: vi.fn((fields) => fields),
}));

vi.mock('./use-prompts', () => ({
	usePrompts: vi.fn(() => ({
		convertToUIMessages: vi.fn((_prompt, _values) => [
			{
				id: 'msg-1',
				role: 'system',
				parts: [{ type: 'text', text: 'Test message' }],
			},
		]),
	})),
}));

// Mock stores
vi.mock('@/stores/collections', () => ({
	useCollectionsStore: vi.fn(() => ({
		getCollection: vi.fn((collection) => {
			if (collection === 'invalid') return null;
			return {
				collection,
				meta: { display_template: '{{ title }}' },
			};
		}),
	})),
}));

vi.mock('@/stores/fields', () => ({
	useFieldsStore: vi.fn(() => ({
		getPrimaryKeyFieldForCollection: vi.fn(() => ({ field: 'id' })),
	})),
}));

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);

	vi.clearAllMocks();

	// Reset window.opener
	Object.defineProperty(window, 'opener', {
		value: null,
		writable: true,
	});
});

describe('useContextStaging', () => {
	describe('stagePrompt', () => {
		test('adds prompt context to pending', () => {
			const contextStore = useAiContextStore();
			const addSpy = vi.spyOn(contextStore, 'addPendingContext');
			const { stagePrompt } = useContextStaging();

			const prompt = { id: '1', name: 'Test Prompt', status: 'published' as const };

			stagePrompt(prompt, { name: 'value' });

			expect(addSpy).toHaveBeenCalled();
			const call = addSpy.mock.calls[0]![0];
			expect(call.type).toBe('prompt');
			expect(call.display).toBe('Test Prompt');
		});

		test('notifies success', () => {
			const { stagePrompt } = useContextStaging();

			stagePrompt({ id: '1', name: 'Test', status: 'published' }, {});

			expect(notify).toHaveBeenCalledWith({
				title: 'ai.prompt_staged',
				type: 'success',
			});
		});

		test('handles errors', () => {
			const contextStore = useAiContextStore();

			vi.spyOn(contextStore, 'addPendingContext').mockImplementation(() => {
				throw new Error('Test error');
			});

			const { stagePrompt } = useContextStaging();

			stagePrompt({ id: '1', name: 'Test', status: 'published' }, {});

			expect(unexpectedError).toHaveBeenCalled();
		});
	});

	describe('stageItems', () => {
		test('returns early for empty ids', async () => {
			const { stageItems } = useContextStaging();

			await stageItems('posts', []);
			await stageItems('posts', null);

			expect(sdk.request).not.toHaveBeenCalled();
		});

		test('returns early for empty collection', async () => {
			const { stageItems } = useContextStaging();

			await stageItems('', ['1']);

			expect(sdk.request).not.toHaveBeenCalled();
		});

		test('notifies error for invalid collection', async () => {
			const { stageItems } = useContextStaging();

			await stageItems('invalid', ['1']);

			expect(notify).toHaveBeenCalledWith({ title: 'ai.invalid_collection' });
		});

		test('fetches items and adds to context', async () => {
			const contextStore = useAiContextStore();
			const addSpy = vi.spyOn(contextStore, 'addPendingContext');

			vi.mocked(sdk.request).mockResolvedValue([
				{ id: 1, title: 'Post 1' },
				{ id: 2, title: 'Post 2' },
			]);

			const { stageItems } = useContextStaging();

			await stageItems('posts', [1, 2]);

			expect(sdk.request).toHaveBeenCalled();
			expect(addSpy).toHaveBeenCalledTimes(2);

			const firstCall = addSpy.mock.calls[0]![0];
			expect(firstCall.type).toBe('item');

			if (firstCall.type === 'item') {
				expect(firstCall.data.collection).toBe('posts');
			}
		});

		test('notifies success after staging', async () => {
			vi.mocked(sdk.request).mockResolvedValue([{ id: 1, title: 'Test' }]);

			const { stageItems } = useContextStaging();

			await stageItems('posts', [1]);

			expect(notify).toHaveBeenCalledWith({ title: 'ai.items_staged' });
		});

		test('handles API errors', async () => {
			const error = new Error('API Error');
			vi.mocked(sdk.request).mockRejectedValue(error);

			const { stageItems } = useContextStaging();

			await stageItems('posts', [1]);

			expect(unexpectedError).toHaveBeenCalledWith(error);
		});
	});

	describe('stageVisualElement', () => {
		test('forwards to parent window if opener exists', async () => {
			const postMessageMock = vi.fn();

			Object.defineProperty(window, 'opener', {
				value: { postMessage: postMessageMock },
				writable: true,
			});

			Object.defineProperty(window, 'location', {
				value: { origin: 'http://localhost:3000' },
				writable: true,
			});

			const { stageVisualElement } = useContextStaging();
			const element = { collection: 'posts', item: '1', key: 'key-1' };

			const result = await stageVisualElement(element);

			expect(postMessageMock).toHaveBeenCalledWith(
				{ action: 'stage-visual-element', data: { element } },
				'http://localhost:3000',
			);

			expect(notify).toHaveBeenCalledWith({ title: 'ai.element_staged' });
			expect(result).toBe(true);
		});

		test('returns false for invalid collection', async () => {
			const { stageVisualElement } = useContextStaging();

			const result = await stageVisualElement({ collection: 'invalid', item: '1', key: 'key-1' });

			expect(notify).toHaveBeenCalledWith({ title: 'ai.invalid_collection' });
			expect(result).toBe(false);
		});

		test('updates existing element when duplicate is staged', async () => {
			const contextStore = useAiContextStore();

			vi.mocked(sdk.request).mockResolvedValue({ id: '1', title: 'Post 1' });

			// Add existing element
			contextStore.pendingContext.push({
				id: 'existing',
				type: 'visual-element',
				data: { collection: 'posts', item: '1', key: 'key-1', fields: ['status', 'title'] },
				display: 'Existing',
			});

			const { stageVisualElement } = useContextStaging();

			const result = await stageVisualElement({
				collection: 'posts',
				item: '1',
				key: 'key-2',
				fields: ['title', 'status'],
			});

			expect(notify).toHaveBeenCalledWith({ title: 'ai.element_already_staged' });
			expect(result).toBe(false);
			expect(contextStore.pendingContext[0]?.data.key).toBe('key-2');
		});

		test('returns false when max limit reached', async () => {
			const contextStore = useAiContextStore();
			vi.spyOn(contextStore, 'addPendingContext').mockReturnValue(false);

			vi.mocked(sdk.request).mockResolvedValue({ id: '1', title: 'Post 1' });

			const { stageVisualElement } = useContextStaging();

			const result = await stageVisualElement({ collection: 'posts', item: '1', key: 'key-1' });

			expect(notify).toHaveBeenCalledWith({ title: 'ai.max_elements_reached' });
			expect(result).toBe(false);
		});

		test('adds element and opens chat on success', async () => {
			const aiStore = useAiStore();
			const contextStore = useAiContextStore();
			const addSpy = vi.spyOn(contextStore, 'addPendingContext').mockReturnValue(true);
			const focusSpy = vi.spyOn(aiStore, 'focusInput').mockImplementation(() => {});

			vi.mocked(sdk.request).mockResolvedValue({ id: '1', title: 'My Post' });

			const { stageVisualElement } = useContextStaging();

			const result = await stageVisualElement({ collection: 'posts', item: '1', key: 'key-1' });

			expect(addSpy).toHaveBeenCalled();
			expect(notify).toHaveBeenCalledWith({ title: 'ai.element_staged' });
			expect(aiStore.chatOpen).toBe(true);
			expect(focusSpy).toHaveBeenCalled();
			expect(result).toBe(true);
		});

		test('uses single field value as display when element has exactly one field', async () => {
			const aiStore = useAiStore();
			const contextStore = useAiContextStore();
			const addSpy = vi.spyOn(contextStore, 'addPendingContext').mockReturnValue(true);
			vi.spyOn(aiStore, 'focusInput').mockImplementation(() => {});
			vi.mocked(sdk.request).mockResolvedValue({ headline: 'Breaking News' });

			const sdkSpy = vi.spyOn(sdk, 'request');

			const { stageVisualElement } = useContextStaging();

			await stageVisualElement({ collection: 'posts', item: '1', key: 'key-1', fields: ['headline'] });

			const call = addSpy.mock.calls[0]![0];
			expect(call.display).toBe('Breaking News');
			expect(sdkSpy.mock.calls[0]?.[0]()).toEqual({ path: '/items/posts/1', query: { fields: ['headline'] } });
		});

		test('uses formatted collection name when no display_template', async () => {
			const aiStore = useAiStore();
			const contextStore = useAiContextStore();
			const addSpy = vi.spyOn(contextStore, 'addPendingContext').mockReturnValue(true);
			vi.spyOn(aiStore, 'focusInput').mockImplementation(() => {});

			const { useCollectionsStore } = await import('@/stores/collections');

			vi.mocked(useCollectionsStore).mockReturnValueOnce({
				getCollection: vi.fn((collection) => ({
					collection,
					meta: { display_template: null },
				})),
			} as any);

			const { stageVisualElement } = useContextStaging();

			await stageVisualElement({ collection: 'blog_posts', item: '1', key: 'key-1' });

			const call = addSpy.mock.calls[0]![0];
			expect(call.display).toBe('Blog Posts');
			expect(sdk.request).not.toHaveBeenCalled();
		});

		test('uses fallback display value when fetch fails', async () => {
			const aiStore = useAiStore();
			const contextStore = useAiContextStore();
			const addSpy = vi.spyOn(contextStore, 'addPendingContext').mockReturnValue(true);
			vi.spyOn(aiStore, 'focusInput').mockImplementation(() => {});

			vi.mocked(sdk.request).mockRejectedValue(new Error('API Error'));

			const { stageVisualElement } = useContextStaging();

			await stageVisualElement({ collection: 'posts', item: '42', key: 'key-1' });

			const call = addSpy.mock.calls[0]![0];
			expect(call.display).toBe('Posts');
		});
	});
});
