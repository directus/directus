import { createTestingPinia } from '@pinia/testing';
import type { UIMessage } from 'ai';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ref } from 'vue';
import { useAiStore } from './use-ai';
import { useAiContextStore } from './use-ai-context';
import { useAiToolsStore } from './use-ai-tools';

let lastChatConfig: any;
let lastTransportConfig: any;
let sessionMessagesRef: { value: UIMessage[] } | undefined;

vi.mock('@vueuse/core', () => {
	return {
		createEventHook: vi.fn(() => {
			const listeners = new Set<(value: unknown) => void>();

			return {
				on: (callback: (value: unknown) => void) => {
					listeners.add(callback);
					return () => listeners.delete(callback);
				},
				trigger: (value: unknown) => {
					for (const listener of listeners) {
						listener(value);
					}
				},
			};
		}),
		useLocalStorage: vi.fn((_key: string, initialValue: unknown) => ref(initialValue)),
		useSessionStorage: vi.fn((_key: string, initialValue: UIMessage[]) => {
			const cloned = JSON.parse(JSON.stringify(initialValue ?? [])) as UIMessage[];
			sessionMessagesRef = ref(cloned);
			return sessionMessagesRef;
		}),
	};
});

// Mock dependencies
vi.mock('@/stores/settings', () => ({
	useSettingsStore: vi.fn(() => ({
		availableAiProviders: ['openai'],
		settings: {
			ai_openai_allowed_models: ['gpt-4o-mini', 'gpt-5-nano'],
			ai_anthropic_allowed_models: null,
			ai_google_allowed_models: null,
			ai_openai_compatible_models: null,
		},
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
			lastChatConfig = config;

			// Create a mutable messages array from the initial messages
			const messages = config?.messages || [];

			return {
				messages,
				status: 'idle',
				error: null,
				sendMessage: vi.fn(() => Promise.resolve()),
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
	DefaultChatTransport: vi.fn((config: any) => {
		lastTransportConfig = config;
		return config;
	}),
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
	lastChatConfig = undefined;
	lastTransportConfig = undefined;
	sessionMessagesRef = undefined;
});

describe('useAiStore', () => {
	describe('loading states', () => {
		test('tracks submission preparation while context/files are prepared', async () => {
			const aiStore = useAiStore();
			const contextStore = useAiContextStore();

			aiStore.input = 'Summarize this';

			let resolveFetchContextData: ((value: any[]) => void) | undefined;

			const fetchContextDataPromise = new Promise<any[]>((resolve) => {
				resolveFetchContextData = resolve;
			});

			vi.spyOn(contextStore, 'fetchContextData').mockReturnValue(fetchContextDataPromise as any);
			vi.spyOn(contextStore, 'uploadPendingFiles').mockResolvedValue([]);

			const submitPromise = aiStore.submit();

			expect(aiStore.isPreparingSubmission).toBe(true);
			expect(aiStore.isUiLoading).toBe(true);
			expect(aiStore.showAssistantLoadingIndicator).toBe(false);

			resolveFetchContextData?.([]);
			await submitPromise;

			expect(aiStore.isPreparingSubmission).toBe(false);
			expect(aiStore.isUiLoading).toBe(false);
			expect(aiStore.showAssistantLoadingIndicator).toBe(false);
		});

		test('shows pending tool execution when assistant tool input is still in progress', () => {
			const aiStore = useAiStore();

			aiStore.chat.messages.push({
				id: '1',
				role: 'assistant',
				parts: [{ type: 'tool-items', toolCallId: 'call-1', state: 'input-available', input: {} } as any],
			});

			expect(aiStore.isAwaitingToolExecution).toBe(true);
			expect(aiStore.hasPendingToolCall).toBe(false);
			expect(aiStore.isUiLoading).toBe(true);
			expect(aiStore.showAssistantLoadingIndicator).toBe(true);
		});

		test('does not treat approval-requested tool state as execution-in-progress', () => {
			const aiStore = useAiStore();

			aiStore.chat.messages.push({
				id: '1',
				role: 'assistant',
				parts: [{ type: 'tool-items', toolCallId: 'call-1', state: 'approval-requested', input: {} } as any],
			});

			expect(aiStore.hasPendingToolCall).toBe(true);
			expect(aiStore.isAwaitingToolExecution).toBe(false);
			expect(aiStore.isUiLoading).toBe(false);
			expect(aiStore.showAssistantLoadingIndicator).toBe(false);
		});
	});

	describe('message sanitization', () => {
		test('sanitizes data/blob file URLs before transport send', () => {
			useAiStore();

			const request = {
				body: {},
				messages: [
					{
						id: '1',
						role: 'user',
						parts: [
							{ type: 'file', mediaType: 'image/png', filename: 'a.png', url: 'data:image/png;base64,abc' },
							{ type: 'file', mediaType: 'image/png', filename: 'b.png', url: 'blob:http://localhost/123' },
							{ type: 'file', mediaType: 'image/png', filename: 'c.png', url: '/assets/abc' },
						],
					},
				],
			};

			const result = lastTransportConfig.prepareSendMessagesRequest(request);
			const parts = result.body.messages[0].parts;

			expect(parts[0].url).toBe('');
			expect(parts[1].url).toBe('');
			expect(parts[2].url).toBe('/assets/abc');
		});

		test('sanitizes stored message file URLs on finish', () => {
			const aiStore = useAiStore();

			aiStore.chat.messages.push({
				id: '1',
				role: 'user',
				parts: [
					{ type: 'file', mediaType: 'image/png', filename: 'a.png', url: 'data:image/png;base64,abc' } as any,
					{ type: 'file', mediaType: 'image/png', filename: 'b.png', url: 'blob:http://localhost/123' } as any,
					{ type: 'file', mediaType: 'image/png', filename: 'c.png', url: '/assets/abc' } as any,
				],
			});

			lastChatConfig.onFinish({ isAbort: false, message: { parts: [] } });
			const parts = sessionMessagesRef?.value[0]?.parts as Array<{ url: string }> | undefined;

			expect(parts).toBeDefined();
			if (!parts) return;

			expect(parts[0].url).toBe('');
			expect(parts[1].url).toBe('');
			expect(parts[2].url).toBe('/assets/abc');
		});
	});

	describe('dehydrate', () => {
		test('should clear all messages', async () => {
			const aiStore = useAiStore();

			// Simulate having messages by directly manipulating the chat.messages array
			// In the real implementation, chat.messages would have data
			const testMessages: UIMessage[] = [
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
			const toolsStore = useAiToolsStore();

			// Set some tool approvals
			toolsStore.setToolApprovalMode('items', 'always');
			toolsStore.setToolApprovalMode('files', 'ask');

			expect(Object.keys(toolsStore.toolApprovals).length).toBeGreaterThan(0);

			await aiStore.dehydrate();

			expect(toolsStore.toolApprovals).toEqual({});
		});

		test('should reset selected model to default', async () => {
			const aiStore = useAiStore();

			// The default model should be set based on available providers
			const defaultModel = aiStore.models[0];

			if (defaultModel) {
				// Select a different model (if there are multiple)
				if (aiStore.models.length > 1) {
					const alternativeModel = aiStore.models[1];

					if (alternativeModel) {
						aiStore.selectModel(alternativeModel);
						expect(aiStore.selectedModel?.model).not.toBe(defaultModel.model);
					}
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
			const toolsStore = useAiToolsStore();

			aiStore.input = 'Test input';
			aiStore.chatOpen = true;
			toolsStore.setToolApprovalMode('items', 'always');
			aiStore.chat.messages.push({ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] });

			await aiStore.dehydrate();

			// Verify everything is reset
			expect(aiStore.messages.length).toBe(0);
			expect(aiStore.input).toBe('');
			expect(toolsStore.toolApprovals).toEqual({});
			expect(aiStore.chatOpen).toBe(false);
		});
	});
});
