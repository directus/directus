import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useAiStore } from '../stores/use-ai';
import { useContextStaging } from './use-context-staging';
import api from '@/api';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';

vi.mock('vue-i18n', () => ({
	useI18n: vi.fn(() => ({
		t: vi.fn((key: string) => key),
	})),
	createI18n: () => undefined,
}));

vi.mock('@/api', () => ({
	default: {
		get: vi.fn(),
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
			const aiStore = useAiStore();
			const addSpy = vi.spyOn(aiStore, 'addPendingContext');
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
			const aiStore = useAiStore();

			vi.spyOn(aiStore, 'addPendingContext').mockImplementation(() => {
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

			expect(api.get).not.toHaveBeenCalled();
		});

		test('returns early for empty collection', async () => {
			const { stageItems } = useContextStaging();

			await stageItems('', ['1']);

			expect(api.get).not.toHaveBeenCalled();
		});

		test('notifies error for invalid collection', async () => {
			const { stageItems } = useContextStaging();

			await stageItems('invalid', ['1']);

			expect(notify).toHaveBeenCalledWith({ title: 'ai.invalid_collection', type: 'error' });
		});

		test('fetches items and adds to context', async () => {
			const aiStore = useAiStore();
			const addSpy = vi.spyOn(aiStore, 'addPendingContext');

			vi.mocked(api.get).mockResolvedValue({
				data: {
					data: [
						{ id: 1, title: 'Post 1' },
						{ id: 2, title: 'Post 2' },
					],
				},
			});

			const { stageItems } = useContextStaging();

			await stageItems('posts', [1, 2]);

			expect(api.get).toHaveBeenCalled();
			expect(addSpy).toHaveBeenCalledTimes(2);

			const firstCall = addSpy.mock.calls[0]![0];
			expect(firstCall.type).toBe('item');

			if (firstCall.type === 'item') {
				expect(firstCall.data.collection).toBe('posts');
			}
		});

		test('notifies success after staging', async () => {
			vi.mocked(api.get).mockResolvedValue({
				data: { data: [{ id: 1, title: 'Test' }] },
			});

			const { stageItems } = useContextStaging();

			await stageItems('posts', [1]);

			expect(notify).toHaveBeenCalledWith({ title: 'ai.items_staged', type: 'success' });
		});

		test('handles API errors', async () => {
			const error = new Error('API Error');
			vi.mocked(api.get).mockRejectedValue(error);

			const { stageItems } = useContextStaging();

			await stageItems('posts', [1]);

			expect(unexpectedError).toHaveBeenCalledWith(error);
		});
	});

	describe('stageVisualElement', () => {
		test('forwards to parent window if opener exists', () => {
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

			const result = stageVisualElement(element, 'Display Value');

			expect(postMessageMock).toHaveBeenCalledWith(
				{ action: 'stage-visual-element', data: { element, displayValue: 'Display Value' } },
				'http://localhost:3000',
			);

			expect(notify).toHaveBeenCalledWith({ title: 'ai.element_staged', type: 'success' });
			expect(result).toBe(true);
		});

		test('returns false for invalid collection', () => {
			const { stageVisualElement } = useContextStaging();

			const result = stageVisualElement({ collection: 'invalid', item: '1', key: 'key-1' }, 'Display');

			expect(notify).toHaveBeenCalledWith({ title: 'ai.invalid_collection', type: 'error' });
			expect(result).toBe(false);
		});

		test('updates existing element when duplicate is staged', () => {
			const aiStore = useAiStore();

			// Add existing element
			aiStore.pendingContext.push({
				id: 'existing',
				type: 'visual-element',
				data: { collection: 'posts', item: '1', key: 'key-1', fields: ['status', 'title'] },
				display: 'Existing',
			});

			const { stageVisualElement } = useContextStaging();

			const result = stageVisualElement(
				{ collection: 'posts', item: '1', key: 'key-2', fields: ['title', 'status'] },
				'Display',
			);

			expect(notify).toHaveBeenCalledWith({ title: 'ai.element_already_staged', type: 'warning' });
			expect(result).toBe(false);
			expect(aiStore.pendingContext[0]?.display).toBe('Display');
			expect(aiStore.pendingContext[0]?.data.key).toBe('key-2');
		});

		test('returns false when max limit reached', () => {
			const aiStore = useAiStore();
			vi.spyOn(aiStore, 'addPendingContext').mockReturnValue(false);

			const { stageVisualElement } = useContextStaging();

			const result = stageVisualElement({ collection: 'posts', item: '1', key: 'key-1' }, 'Display');

			expect(notify).toHaveBeenCalledWith({ title: 'ai.max_elements_reached', type: 'warning' });
			expect(result).toBe(false);
		});

		test('adds element and opens chat on success', () => {
			const aiStore = useAiStore();
			const addSpy = vi.spyOn(aiStore, 'addPendingContext').mockReturnValue(true);
			const focusSpy = vi.spyOn(aiStore, 'focusInput').mockImplementation(() => {});

			const { stageVisualElement } = useContextStaging();

			const result = stageVisualElement({ collection: 'posts', item: '1', key: 'key-1' }, 'My Post');

			expect(addSpy).toHaveBeenCalled();
			expect(notify).toHaveBeenCalledWith({ title: 'ai.element_staged', type: 'success' });
			expect(aiStore.chatOpen).toBe(true);
			expect(focusSpy).toHaveBeenCalled();
			expect(result).toBe(true);
		});

		test('uses fallback display value if not provided', () => {
			const aiStore = useAiStore();
			const addSpy = vi.spyOn(aiStore, 'addPendingContext').mockReturnValue(true);
			vi.spyOn(aiStore, 'focusInput').mockImplementation(() => {});

			const { stageVisualElement } = useContextStaging();

			stageVisualElement({ collection: 'posts', item: '42', key: 'key-1' }, '');

			const call = addSpy.mock.calls[0]![0];
			expect(call.display).toBe('Posts #42');
		});
	});
});
