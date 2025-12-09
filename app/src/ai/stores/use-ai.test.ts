import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useAiStore } from './use-ai';

// Mock dependencies
vi.mock('@/stores/settings', () => ({
	useSettingsStore: vi.fn(() => ({
		availableAiProviders: ['openai'],
	})),
}));

vi.mock('@/views/private/private-view/stores/sidebar', () => ({
	useSidebarStore: vi.fn(() => ({
		expand: vi.fn(),
		onCollapse: vi.fn(),
	})),
}));

vi.mock('@ai-sdk/vue', () => {
	return {
		Chat: vi.fn().mockImplementation((config: any) => {
			// Create a mutable messages array from the initial messages
			const messages = config?.messages || [];

			return {
				messages,
				status: 'idle',
				error: null,
				sendMessage: vi.fn(),
				clearError: vi.fn(),
				regenerate: vi.fn(),
				stop: vi.fn(),
				addToolResult: vi.fn(),
				addToolApprovalResponse: vi.fn(),
			};
		}),
	};
});

vi.mock('ai', () => ({
	DefaultChatTransport: vi.fn(),
	lastAssistantMessageIsCompleteWithApprovalResponses: vi.fn(),
	lastAssistantMessageIsCompleteWithToolCalls: vi.fn(),
}));

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);

	// Clear localStorage and sessionStorage before each test
	localStorage.clear();
	sessionStorage.clear();
});

describe('useAiStore', () => {
	describe('dehydrate', () => {
		test('should clear all messages', async () => {
			const aiStore = useAiStore();

			// Simulate having messages by directly manipulating the chat.messages array
			// In the real implementation, chat.messages would have data
			const testMessages = [
				{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
				{ id: '2', role: 'assistant', parts: [{ type: 'text', text: 'Hi there!' }] },
			];

			// Push messages to the chat's messages array
			aiStore.chat.messages.push(...testMessages);

			// Verify messages were added
			expect(aiStore.chat.messages.length).toBe(2);
			expect(aiStore.messages.length).toBe(2);

			await aiStore.dehydrate();

			// After dehydrate, messages should be cleared via reset()
			expect(aiStore.chat.messages.length).toBe(0);
			expect(aiStore.messages.length).toBe(0);
		});

		test('should reset input to empty string', async () => {
			const aiStore = useAiStore();

			// Set input
			aiStore.input = 'Some input text';

			expect(aiStore.input).toBe('Some input text');

			await aiStore.dehydrate();

			expect(aiStore.input).toBe('');
		});

		test('should reset tool approvals to empty object', async () => {
			const aiStore = useAiStore();

			// Set some tool approvals
			aiStore.setToolApprovalMode('items', 'always');
			aiStore.setToolApprovalMode('files', 'ask');

			expect(Object.keys(aiStore.toolApprovals).length).toBeGreaterThan(0);

			await aiStore.dehydrate();

			expect(aiStore.toolApprovals).toEqual({});
		});

		test('should reset selected model to default', async () => {
			const aiStore = useAiStore();

			// The default model should be set based on available providers
			const defaultModel = aiStore.models[0];

			if (defaultModel) {
				// Select a different model (if there are multiple)
				if (aiStore.models.length > 1) {
					aiStore.selectModel(aiStore.models[1]);
					expect(aiStore.selectedModel?.model).not.toBe(defaultModel.model);
				}

				await aiStore.dehydrate();

				// After dehydrate, should reset to default
				if (aiStore.models[0]) {
					expect(aiStore.selectedModel?.provider).toBe(aiStore.models[0].provider);
					expect(aiStore.selectedModel?.model).toBe(aiStore.models[0].model);
				}
			} else {
				// If no models available, selectedModel should be null
				await aiStore.dehydrate();
				expect(aiStore.selectedModel).toBeNull();
			}
		});

		test('should close chat window', async () => {
			const aiStore = useAiStore();

			// Open chat window
			aiStore.chatOpen = true;

			expect(aiStore.chatOpen).toBe(true);

			await aiStore.dehydrate();

			expect(aiStore.chatOpen).toBe(false);
		});

		test('should reset all state together', async () => {
			const aiStore = useAiStore();

			// Set up some state
			aiStore.input = 'Test input';
			aiStore.chatOpen = true;
			aiStore.setToolApprovalMode('items', 'always');
			aiStore.chat.messages.push({ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] });

			await aiStore.dehydrate();

			// Verify everything is reset
			expect(aiStore.messages.length).toBe(0);
			expect(aiStore.input).toBe('');
			expect(aiStore.toolApprovals).toEqual({});
			expect(aiStore.chatOpen).toBe(false);
		});
	});
});
