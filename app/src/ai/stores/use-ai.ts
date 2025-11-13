import { useSettingsStore } from '@/stores/settings';
import { useSidebarStore } from '@/views/private/private-view/stores/sidebar';
import { Chat } from '@ai-sdk/vue';
import { useLocalStorage } from '@vueuse/core';
import { DefaultChatTransport, type UIMessage, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { defineStore } from 'pinia';
import { computed, reactive, ref, shallowRef, watch } from 'vue';
import { z } from 'zod';
import { StaticToolDefinition } from '../composables/define-tool';
import { AI_MODELS, type ModelDefinition } from '../models';

export const useAiStore = defineStore('ai-store', () => {
	const settingsStore = useSettingsStore();
	const sidebarStore = useSidebarStore();

	const chatOpen = ref<boolean>(false);

	watch(chatOpen, (newOpen) => {
		if (newOpen === true) sidebarStore.expand();
	});

	sidebarStore.onCollapse(() => {
		chatOpen.value = false;
	});

	const models = computed(() =>
		AI_MODELS.filter(({ provider }) => {
			return settingsStore.availableAiProviders.includes(provider);
		}),
	);

	const defaultModel = computed(() => models.value[0] ?? null);

	const selectedModelId = useLocalStorage<string | null>(
		'selected-ai-model',
		defaultModel.value ? `${defaultModel.value.provider}:${defaultModel.value.model}` : null,
	);

	const selectedModel = computed(() => {
		if (!selectedModelId.value) return null;

		const [provider, model] = selectedModelId.value.split(':');

		if (!provider && !model) return null;

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

	const systemTools = shallowRef<string[]>([
		'items',
		'files',
		'folders',
		'assets',
		'flows',
		'trigger-flow',
		'operations',
		'schema',
		'collections',
		'fields',
		'relations',
	]);

	const localTools = shallowRef<StaticToolDefinition[]>([]);

	const toApiTool = (tool: StaticToolDefinition) => ({
		name: tool.name,
		description: tool.description,
		inputSchema: z.toJSONSchema(tool.inputSchema, { target: 'draft-7' }),
	});

	const chat = new Chat<UIMessage>({
		transport: new DefaultChatTransport({
			api: '/ai/chat',
			credentials: 'include',
			body: () => ({
				provider: selectedModel.value?.provider,
				model: selectedModel.value?.model,
				tools: [...systemTools.value, ...localTools.value.map(toApiTool)],
			}),
		}),
		sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
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
		},
		onData: (data) => {
			if (data.type === 'data-usage') {
				const usageData = data.data as Record<string, unknown>;
				const { inputTokens, outputTokens, totalTokens } = usageData;
				if (typeof inputTokens === 'number') usage.inputTokens = inputTokens;
				if (typeof outputTokens === 'number') usage.outputTokens = outputTokens;
				if (typeof totalTokens === 'number') usage.totalTokens = totalTokens;
			}
		},
		onToolCall: async ({ toolCall }) => {
			const isServerTool = toolCall.dynamic || systemTools.value.includes(toolCall.toolName);

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

	const status = computed(() => chat.status);

	const addMessage = (message: string) => {
		chat.sendMessage({ text: message });
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
	};

	const usage = reactive({
		cachedInputTokens: 0,
		inputTokens: 0,
		outputTokens: 0,
		totalTokens: 0,
	});

	return {
		addMessage,
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
	};
});
