import { useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import {  computed } from 'vue';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { AI_MODELS } from '../models';
import { Chat } from '@ai-sdk/vue';

export const useAiStore = defineStore('ai-store', () => {
	const selectedModel = useLocalStorage<string | null>('selected-ai-model', AI_MODELS[0] ?? null);

	const currentProvider = computed(() => selectedModel.value?.split('/')[0] ?? 'openai');
	const currentModel = computed(() => selectedModel.value?.split('/')[1] ?? 'gpt-5');


	const chat = new Chat<UIMessage>({
		transport: new DefaultChatTransport({
			api: '/ai/chat',
			body: () => ({
				provider: currentProvider.value,
				model: currentModel.value,
			}),
			credentials: 'include',
		}),
	});

	const messages = computed(() => chat.messages);
	const status = computed(() => chat.status);

	function updateSelectedModel(model: string) {
		selectedModel.value = model;
	}

	function addMessage(message: string) {
		chat.sendMessage({ text: message });
	}


	return {
		currentProvider,
		currentModel,
		addMessage,
		chat,
		messages,
		status,
		models: AI_MODELS,
		selectedModel,
		updateSelectedModel,
	};
});
