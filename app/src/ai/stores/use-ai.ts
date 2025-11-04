import { useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Chat } from '@ai-sdk/vue';
import { DefaultChatTransport, type UIMessage } from 'ai';

import { AI_MODELS } from '../models';

export const useAiStore = defineStore('ai-store', () => {
	const selectedModel = useLocalStorage<string | null>('selected-ai-model', AI_MODELS[0] ?? null);

	const clientTools = ref<Record<string, (args: any) => Promise<any>>>({});

	const chat = new Chat<UIMessage>({
		messages: [],
		transport: new DefaultChatTransport({
			api: '/ai/chat',
			body: {},
		}),
		onToolCall: async ({ toolCall }) => {
			const { name: toolName, args, toolCallId } = toolCall as any;

			const clientTool = clientTools.value[toolName];

			if (clientTool) {
				try {
					const output = await clientTool(args);

					await chat.addToolResult({
						tool: toolName,
						toolCallId,
						output,
					});
				} catch (_error) {
					await chat.addToolResult({
						state: 'output-error',
						tool: toolName,
						toolCallId,
						errorText: _error instanceof Error ? _error.message : 'Unknown error',
					});
				}
			}
		},
	});

	function registerClientTool(name: string, handler: (args: any) => Promise<any>) {
		clientTools.value[name] = handler;
	}

	function unregisterClientTool(name: string) {
		delete clientTools.value[name];
	}

	return {
		models: AI_MODELS,
		selectedModel,
		chat,
		registerClientTool,
		unregisterClientTool,
	};
});
