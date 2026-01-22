import { Chat } from '@ai-sdk/vue';
import { type ContextAttachment, type StandardProviderType, type SystemTool } from '@directus/ai';
import { createEventHook, useLocalStorage, useSessionStorage } from '@vueuse/core';
import {
	DefaultChatTransport,
	lastAssistantMessageIsCompleteWithApprovalResponses,
	lastAssistantMessageIsCompleteWithToolCalls,
	type UIMessage,
} from 'ai';
import { defineStore } from 'pinia';
import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { z } from 'zod';
import type { StaticToolDefinition } from '../composables/define-tool';
import { AI_MODELS, type AppModelDefinition, buildCustomModelDefinition, buildCustomModels } from '../models';
import { useAiContextStore } from './use-ai-context';
import { useAiToolsStore } from './use-ai-tools';
import { useSettingsStore } from '@/stores/settings';
import { useSidebarStore } from '@/views/private/private-view/stores/sidebar';

export const useAiStore = defineStore('ai-store', () => {
	const settingsStore = useSettingsStore();
	const sidebarStore = useSidebarStore();
	const contextStore = useAiContextStore();
	const toolsStore = useAiToolsStore();
	const route = useRoute();

	const storedMessages = useSessionStorage<UIMessage[]>('directus-ai-chat-messages', []);

	// UI State
	const chatOpen = useLocalStorage<boolean>('ai-chat-open', false);
	const input = ref<string>('');

	// UI event hooks
	const visualElementHighlightHook = createEventHook<[key: string | null]>();
	const focusInputHook = createEventHook();

	const highlightVisualElement = (key: string | null) => {
		visualElementHighlightHook.trigger(key);
	};

	const focusInput = () => {
		focusInputHook.trigger(null);
	};

	// Sidebar integration
	watch(chatOpen, (newOpen) => {
		if (newOpen === true) sidebarStore.expand();
	});

	sidebarStore.onCollapse(() => {
		chatOpen.value = false;
	});

	// Model selection
	const models = computed(() => {
		const customModels = buildCustomModels(settingsStore.settings?.ai_openai_compatible_models ?? null);
		const allModels = [...AI_MODELS, ...customModels];

		const allowedModelsMap: Record<StandardProviderType, string[] | null> = {
			openai: settingsStore.settings?.ai_openai_allowed_models ?? null,
			anthropic: settingsStore.settings?.ai_anthropic_allowed_models ?? null,
			google: settingsStore.settings?.ai_google_allowed_models ?? null,
		};

		const result: AppModelDefinition[] = [];

		// Add models that are allowed or explicitly configured
		for (const modelDef of allModels) {
			if (!settingsStore.availableAiProviders.includes(modelDef.provider)) continue;

			// openai-compatible models are always allowed (user explicitly configured them)
			if (modelDef.provider === 'openai-compatible') {
				result.push(modelDef);
				continue;
			}

			const allowedModels = allowedModelsMap[modelDef.provider];

			if (!allowedModels || allowedModels.length === 0) continue;

			if (allowedModels.includes(modelDef.model)) {
				result.push(modelDef);
			}
		}

		// Add custom model IDs that are in allowed list but not in predefined models
		for (const [provider, allowedModels] of Object.entries(allowedModelsMap)) {
			if (!allowedModels || allowedModels.length === 0) continue;
			if (!settingsStore.availableAiProviders.includes(provider)) continue;

			for (const modelId of allowedModels) {
				const exists = result.some((m) => m.provider === provider && m.model === modelId);

				if (!exists) {
					result.push(buildCustomModelDefinition(provider as StandardProviderType, modelId));
				}
			}
		}

		return result;
	});

	const defaultModel = computed(() => models.value[0] ?? null);

	const selectedModelId = useLocalStorage<string | null>(
		'selected-ai-model',
		defaultModel.value ? `${defaultModel.value.provider}:${defaultModel.value.model}` : null,
	);

	watch(
		() => defaultModel.value,
		(newDefaultModel) => {
			if (selectedModelId.value === null && newDefaultModel) {
				selectedModelId.value = `${newDefaultModel.provider}:${newDefaultModel.model}`;
			}
		},
		{ immediate: true },
	);

	const selectedModel = computed(() => {
		if (!selectedModelId.value) return null;

		// Split only on first colon - model IDs may contain colons (e.g., "gpt-oss:20b")
		const colonIndex = selectedModelId.value.indexOf(':');

		if (colonIndex === -1) return null;

		const provider = selectedModelId.value.slice(0, colonIndex);
		const model = selectedModelId.value.slice(colonIndex + 1);

		if (!provider || !model) return null;

		return (
			models.value.find((modelDefinition) => {
				return modelDefinition.provider === provider && modelDefinition.model === model;
			}) ??
			defaultModel.value ??
			null
		);
	});

	const selectModel = (modelDefinition: AppModelDefinition) => {
		selectedModelId.value = `${modelDefinition.provider}:${modelDefinition.model}`;
	};

	// Helper to convert local tool to API format
	const toApiTool = (tool: StaticToolDefinition) => ({
		name: tool.name,
		description: tool.description,
		inputSchema: z.toJSONSchema(tool.inputSchema, { target: 'draft-7' }),
	});

	// Current page context from route
	const currentPageContext = computed(() => {
		const path = route.path;
		const collection = route.params.collection as string | undefined;
		const item = route.params.primaryKey as string | number | undefined;

		// Extract module from path (first segment after /)
		const pathParts = path.split('/').filter(Boolean);
		const module = pathParts[0];

		return {
			path,
			...(collection && { collection }),
			...(item !== undefined && { item }),
			...(module && { module }),
		};
	});

	// Store snapshotted context attachments for sending with request
	const pendingContextSnapshot = ref<ContextAttachment[]>([]);

	// Chat instance
	const chat = new Chat<UIMessage>({
		messages: storedMessages.value,
		transport: new DefaultChatTransport({
			api: '/ai/chat',
			credentials: 'include',
			body: () => {
				const tools = [...toolsStore.enabledSystemTools, ...toolsStore.localTools.map(toApiTool)];

				// Filter toolApprovals to only include 'always' and 'ask' (not 'disabled')
				const approvals: Record<string, 'always' | 'ask'> = {};

				for (const [toolName, mode] of Object.entries(toolsStore.toolApprovals)) {
					if (mode === 'always' || mode === 'ask') {
						approvals[toolName] = mode;
					}
				}

				// Build context for system prompt
				const context: {
					attachments?: ContextAttachment[];
					page?: { path: string; collection?: string; item?: string | number; module?: string };
				} = {
					page: currentPageContext.value,
				};

				if (pendingContextSnapshot.value.length > 0) {
					context.attachments = pendingContextSnapshot.value;
				}

				return {
					provider: selectedModel.value?.provider,
					model: selectedModel.value?.model,
					tools,
					toolApprovals: approvals,
					context,
				};
			},
			prepareSendMessagesRequest: (req) => {
				const limitedMessages =
					estimatedMaxMessages.value < Infinity ? req.messages.slice(-estimatedMaxMessages.value) : req.messages;

				return {
					...req,
					body: {
						...req.body,
						messages: limitedMessages,
					},
				};
			},
		}),
		sendAutomaticallyWhen: ({ messages }) =>
			lastAssistantMessageIsCompleteWithApprovalResponses({ messages }) ||
			lastAssistantMessageIsCompleteWithToolCalls({ messages }),
		onData: (data) => {
			if (data.type === 'data-usage') {
				const usageData = data.data as Record<string, unknown>;
				const { inputTokens, outputTokens, totalTokens } = usageData;

				if (typeof inputTokens === 'number') tokenUsage.inputTokens = inputTokens;
				if (typeof outputTokens === 'number') tokenUsage.outputTokens = outputTokens;
				if (typeof totalTokens === 'number') tokenUsage.totalTokens = totalTokens;

				if (contextUsagePercentage.value > 0) {
					estimatedMaxMessages.value = Math.floor((messages.value.length / contextUsagePercentage.value) * 100);
				}
			}
		},
		onToolCall: async ({ toolCall }) => {
			const isServerTool = toolCall.dynamic || toolsStore.isSystemTool(toolCall.toolName);

			if (isServerTool) {
				return;
			}

			const tool = toolsStore.localTools.find((tool) => tool.name === toolCall.toolName);

			if (!tool) {
				throw new Error(`Tool by name "${toolCall.toolName}" does not exist`);
			}

			try {
				const output = await tool.execute(toolCall.input as Record<string, unknown>);
				chat.addToolResult({ tool: toolCall.toolName, output, toolCallId: toolCall.toolCallId });
			} catch (e: unknown) {
				const errorText = e instanceof Error ? e.message : String(e);

				chat.addToolResult({
					tool: toolCall.toolName,
					state: 'output-error',
					errorText,
					toolCallId: toolCall.toolCallId,
				});
			}
		},
		onFinish: ({ isAbort, message }) => {
			if (isAbort) {
				message.parts.forEach((part) => {
					if (part.type === 'reasoning') {
						part.state = 'done';
						delete part.providerMetadata;
					}
				});
			}

			storedMessages.value = chat.messages;
		},
	});

	const error = computed(() => chat.error);

	const messages = computed(() =>
		chat.messages.map((msg) => ({
			...msg,
			parts: [...(msg.parts ?? [])],
		})),
	);

	const latestMessage = computed(() => messages.value.at(-1));

	const hasPendingToolCall = computed(() => {
		const lastMessage = latestMessage.value;
		if (!lastMessage || lastMessage.role !== 'assistant') return false;

		return lastMessage.parts.some((part) => 'state' in part && part.state === 'approval-requested');
	});

	// Watch for tool results to trigger hooks
	const processedToolCallIds = new Set<string>();

	watch(latestMessage, (message) => {
		if (!message) return;

		for (const part of message.parts) {
			if ('toolCallId' in part && part.state === 'output-available' && !processedToolCallIds.has(part.toolCallId)) {
				processedToolCallIds.add(part.toolCallId);

				const tool = part.type.substring('tool-'.length) as SystemTool;

				if (toolsStore.isSystemTool(tool)) {
					toolsStore.triggerSystemToolResult(
						tool,
						part.input as Record<string, unknown>,
						part.output as Record<string, unknown>,
					);
				}
			}
		}
	});

	const status = computed(() => chat.status);

	const submitHook = createEventHook();

	const submit = async () => {
		if (chat.status === 'streaming' || chat.status === 'submitted') return;

		// Snapshot context for sending with request (will be included in body via transport)
		pendingContextSnapshot.value = await contextStore.snapshotContext();

		// Include attachments in message metadata for UI display
		chat.sendMessage({
			text: input.value,
			metadata: {
				attachments: pendingContextSnapshot.value.length > 0 ? pendingContextSnapshot.value : undefined,
			},
		});

		submitHook.trigger(input.value);
		input.value = '';

		// Clear non-visual context after submit (visual elements persist for tool calls)
		contextStore.clearNonVisualContext();
	};

	const retry = () => {
		chat.clearError();
		chat.regenerate();
	};

	const stop = () => {
		chat.stop();
	};

	const reset = () => {
		chat.clearError();
		chat.messages.splice(0, chat.messages.length);
		storedMessages.value = [];
		processedToolCallIds.clear();

		tokenUsage.inputTokens = 0;
		tokenUsage.outputTokens = 0;
		tokenUsage.totalTokens = 0;
		estimatedMaxMessages.value = Infinity;
	};

	const dehydrate = async () => {
		reset();
		input.value = '';
		selectedModelId.value = defaultModel.value ? `${defaultModel.value.provider}:${defaultModel.value.model}` : null;
		chatOpen.value = false;

		// Dehydrate sub-stores
		contextStore.dehydrate();
		toolsStore.dehydrate();
	};

	const estimatedMaxMessages = ref(Infinity);

	const tokenUsage = reactive({ inputTokens: 0, outputTokens: 0, totalTokens: 0 });

	const contextUsagePercentage = computed(() => {
		if (!selectedModel.value) return 0;

		const { limit } = selectedModel.value;

		const context = limit.context > 0 ? (tokenUsage.totalTokens / limit.context) * 100 : 0;

		return context;
	});

	const approveToolCall = (approvalId: string) => {
		chat.addToolApprovalResponse({ id: approvalId, approved: true });
	};

	const denyToolCall = (approvalId: string) => {
		chat.addToolApprovalResponse({ id: approvalId, approved: false });
	};

	return {
		// UI State
		input,
		chatOpen,

		// Chat
		chat,
		messages,
		status,
		error,
		submit,
		retry,
		stop,
		reset,
		dehydrate,
		onSubmit: submitHook.on,
		hasPendingToolCall,
		approveToolCall,
		denyToolCall,

		// Model selection
		selectedModel,
		models,
		selectModel,

		// Token usage
		tokenUsage,
		contextUsagePercentage,
		estimatedMaxMessages,

		// UI hooks
		highlightVisualElement,
		onVisualElementHighlight: visualElementHighlightHook.on,
		focusInput,
		onFocusInput: focusInputHook.on,

		pendingContext: computed(() => contextStore.pendingContext),
		addPendingContext: contextStore.addPendingContext,
		removePendingContext: contextStore.removePendingContext,
		clearPendingContext: contextStore.clearPendingContext,
		clearVisualElementContext: contextStore.clearVisualElementContext,
		setVisualElementContextUrl: contextStore.setVisualElementContextUrl,
		visualElementContextUrl: computed(() => contextStore.visualElementContextUrl),
		hasVisualElementContext: computed(() => contextStore.hasVisualElementContext),

		systemTools: computed(() => toolsStore.systemTools),
		localTools: computed(() => toolsStore.localTools),
		toolApprovals: computed(() => toolsStore.toolApprovals),
		getToolApprovalMode: toolsStore.getToolApprovalMode,
		setToolApprovalMode: toolsStore.setToolApprovalMode,
		setAllToolsMode: toolsStore.setAllToolsMode,
		registerLocalTool: toolsStore.registerLocalTool,
		replaceLocalTool: toolsStore.replaceLocalTool,
		deregisterLocalTool: toolsStore.deregisterLocalTool,
		onSystemToolResult: toolsStore.onSystemToolResult,
		triggerSystemToolResult: toolsStore.triggerSystemToolResult,
	};
});
