import { Chat } from '@ai-sdk/vue';
import { createEventHook, useLocalStorage, useSessionStorage } from '@vueuse/core';
import {
	DefaultChatTransport,
	lastAssistantMessageIsCompleteWithApprovalResponses,
	lastAssistantMessageIsCompleteWithToolCalls,
	type UIMessage,
} from 'ai';
import { defineStore } from 'pinia';
import { computed, reactive, ref, shallowRef, watch } from 'vue';
import { z } from 'zod';
import { StaticToolDefinition } from '../composables/define-tool';
import { buildCustomModelDefinition, buildCustomModels, DEFAULT_AI_MODELS, type ModelDefinition } from '../models';
import { SystemTool } from '../types/system-tool';
import { useSettingsStore } from '@/stores/settings';
import { useSidebarStore } from '@/views/private/private-view/stores/sidebar';

export type ToolApprovalMode = 'always' | 'ask' | 'disabled';

export const useAiStore = defineStore('ai-store', () => {
	const settingsStore = useSettingsStore();
	const sidebarStore = useSidebarStore();
	const storedMessages = useSessionStorage<UIMessage[]>('directus-ai-chat-messages', []);

	// Tool approval settings
	const toolApprovals = useLocalStorage<Record<string, ToolApprovalMode>>('ai-tool-approvals', {});

	const getToolApprovalMode = (toolName: string): ToolApprovalMode => {
		return toolApprovals.value[toolName] ?? 'ask';
	};

	const setToolApprovalMode = (toolName: string, mode: ToolApprovalMode) => {
		toolApprovals.value = { ...toolApprovals.value, [toolName]: mode };
	};

	const setAllToolsMode = (mode: ToolApprovalMode) => {
		const newApprovals: Record<string, ToolApprovalMode> = {};

		for (const tool of systemTools.value) {
			newApprovals[tool] = mode;
		}

		toolApprovals.value = newApprovals;
	};

	const chatOpen = useLocalStorage<boolean>('ai-chat-open', false);
	const input = ref<string>('');

	watch(chatOpen, (newOpen) => {
		if (newOpen === true) sidebarStore.expand();
	});

	sidebarStore.onCollapse(() => {
		chatOpen.value = false;
	});

	const models = computed(() => {
		const customModels = buildCustomModels(settingsStore.settings?.ai_openai_compatible_models ?? null);
		const allModels = [...DEFAULT_AI_MODELS, ...customModels];

		const allowedModelsMap: Record<string, string[] | null> = {
			openai: settingsStore.settings?.ai_openai_allowed_models ?? null,
			anthropic: settingsStore.settings?.ai_anthropic_allowed_models ?? null,
			google: settingsStore.settings?.ai_google_allowed_models ?? null,
		};

		const result: ModelDefinition[] = [];

		// Add predefined models that are in the allowed list
		for (const modelDef of allModels) {
			if (!settingsStore.availableAiProviders.includes(modelDef.provider)) continue;

			const allowedModels = allowedModelsMap[modelDef.provider];

			// null or empty = no models allowed for that provider
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
					result.push(buildCustomModelDefinition(provider, modelId));
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

	// Ensure selectedModelId is set to the default model when models become available
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

	const selectModel = (modelDefinition: ModelDefinition) => {
		selectedModelId.value = `${modelDefinition.provider}:${modelDefinition.model}`;
	};

	const systemTools = shallowRef<SystemTool[]>([
		'items',
		'files',
		'folders',
		// Omit 'assets' because we don't support image or audio uploads yet
		// 'assets',
		'flows',
		'trigger-flow',
		'operations',
		'schema',
		'collections',
		'fields',
		'relations',
	]);

	// Filter system tools based on approval mode (exclude 'disabled')
	const enabledSystemTools = computed(() => {
		return systemTools.value.filter((tool) => getToolApprovalMode(tool) !== 'disabled');
	});

	const localTools = shallowRef<StaticToolDefinition[]>([]);

	const systemToolResultHook =
		createEventHook<[tool: SystemTool, input: Record<string, unknown>, output: Record<string, unknown>]>();

	const toApiTool = (tool: StaticToolDefinition) => ({
		name: tool.name,
		description: tool.description,
		inputSchema: z.toJSONSchema(tool.inputSchema, { target: 'draft-7' }),
	});

	const chat = new Chat<UIMessage>({
		messages: storedMessages.value,
		transport: new DefaultChatTransport({
			api: '/ai/chat',
			credentials: 'include',
			body: () => {
				const tools = [...enabledSystemTools.value, ...localTools.value.map(toApiTool)];

				// Filter toolApprovals to only include 'always' and 'ask' (not 'disabled')
				const approvals: Record<string, 'always' | 'ask'> = {};

				for (const [toolName, mode] of Object.entries(toolApprovals.value)) {
					if (mode === 'always' || mode === 'ask') {
						approvals[toolName] = mode;
					}
				}

				return {
					provider: selectedModel.value?.provider,
					model: selectedModel.value?.model,
					tools,
					toolApprovals: approvals,
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
			const isServerTool = toolCall.dynamic || systemTools.value.includes(toolCall.toolName as SystemTool);

			if (isServerTool) {
				return;
			}

			const tool = localTools.value.find((tool) => tool.name === toolCall.toolName);

			if (!tool) {
				throw new Error(`Tool by name "${toolCall.toolName}" does not exist`);
			}

			try {
				const output = await tool.execute(toolCall.input as Record<string, unknown>);
				chat.addToolResult({ tool: toolCall.toolName, output, toolCallId: toolCall.toolCallId });
			} catch (e: unknown) {
				if (e instanceof Error) {
					chat.addToolResult({
						tool: toolCall.toolName,
						state: 'output-error',
						errorText: e.message,
						toolCallId: toolCall.toolCallId,
					});
				}
			}
		},
		onFinish: ({ isAbort, message }) => {
			if (isAbort) {
				// Update the state to done and delete the providerMetadata from the aborted message.parts where part.type === 'reasoning' to prevent OpenAI reasoning issues
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
		// Ensure Vue notices changes within msg.parts when the Chat SDK mutates the array in place.
		// By spreading msg.parts we create a fresh array reference which is fully reactive for consumers.
		// This keeps "parts" immutable from the perspective of the UI layer and guarantees rerenders
		// on content changes (push/replace) performed internally by the chat instance.
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

	const processedToolCallIds = new Set<string>();

	watch(latestMessage, (message) => {
		if (!message) return;

		for (const part of message.parts) {
			if ('toolCallId' in part && part.state === 'output-available' && !processedToolCallIds.has(part.toolCallId)) {
				processedToolCallIds.add(part.toolCallId);

				const tool = part.type.substring('tool-'.length);

				const isSystemTool = systemTools.value.includes(tool);

				if (isSystemTool) {
					systemToolResultHook.trigger(tool as SystemTool, part.input, part.output);
				}
			}
		}
	});

	const status = computed(() => chat.status);

	const submitHook = createEventHook();

	const submit = () => {
		if (chat.status === 'streaming' || chat.status === 'submitted') return;
		chat.sendMessage({ text: input.value });
		submitHook.trigger(input.value);
		input.value = '';
	};

	const registerLocalTool = (tool: StaticToolDefinition) => {
		localTools.value = [...localTools.value, tool];
	};

	const replaceLocalTool = (name: string, tool: StaticToolDefinition) => {
		localTools.value = localTools.value.map((t) => (t.name === name ? tool : t));
	};

	const deregisterLocalTool = (name: string) => {
		localTools.value = localTools.value.filter((t) => t.name !== name);
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
		toolApprovals.value = {};
		selectedModelId.value = defaultModel.value ? `${defaultModel.value.provider}:${defaultModel.value.model}` : null;
		chatOpen.value = false;
	};

	/**
	 * Guesstimate of what the messages limit is based on the current average token size per message.
	 * This is updated whenever the actual token usage is returned from the server. We default to
	 * infinity as we can't know a theoretical limit until the server responds with actual token
	 * usage. Input context also includes tool definitions (of which we don't know the size), so this
	 * estimate is never fully accurate.
	 * @default Infinity
	 */
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
		input,
		chat,
		messages,
		status,
		selectedModel,
		models,
		registerLocalTool,
		replaceLocalTool,
		deregisterLocalTool,
		systemTools,
		localTools,
		error,
		retry,
		stop,
		reset,
		chatOpen,
		selectModel,
		tokenUsage,
		contextUsagePercentage,
		submit,
		onSubmit: submitHook.on,
		estimatedMaxMessages,
		onSystemToolResult: systemToolResultHook.on,
		toolApprovals,
		getToolApprovalMode,
		setToolApprovalMode,
		setAllToolsMode,
		approveToolCall,
		denyToolCall,
		hasPendingToolCall,
		dehydrate,
	};
});
