import { useSettingsStore } from '@/stores/settings';
import { Chat } from '@ai-sdk/vue';
import { useLocalStorage } from '@vueuse/core';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { defineStore } from 'pinia';
import { computed, } from 'vue';
import { AI_MODELS } from '../models';
import { getSimpleHash } from '@directus/utils';

export const useAiStore = defineStore('ai-store', () => {
	const settingsStore = useSettingsStore();

	const models = computed(() =>
		AI_MODELS.filter((model) => {
			const provider = model.split('/')[0]!;
			return settingsStore.availableAiProviders.includes(provider);
		}),
	);

	const defaultProvider = computed(() => models.value[0]?.split('/')[0] ?? null);

	const defaultModel = computed(() => models.value[0]?.split('/')[1] ?? null);

	const selectedModel = useLocalStorage<string | null>('selected-ai-model', defaultModel.value);

	const currentProvider = computed(() => selectedModel.value?.split('/')[0] ?? defaultProvider.value);
	const currentModel = computed(() => selectedModel.value?.split('/')[1] ?? defaultModel.value);

	const chat = new Chat<UIMessage>({
		transport: new DefaultChatTransport({
			api: '/ai/chat',
			body: () => ({
				provider: currentProvider.value,
				model: currentModel.value,
				tools: [],
			}),
			credentials: 'include',
		}),

	});

	const error = computed(() => chat.error);

	const messages = computed(() =>
		chat.messages.map((msg) => ({
			hash: getSimpleHash(JSON.stringify(msg.parts)),
			...msg,
		})),
	);

	const status = computed(() => chat.status);

	function updateSelectedModel(model: string) {
		selectedModel.value = model;
	}

	function addMessage(message: string) {
		chat.sendMessage({ text: message });
	}

	function clearConversation() {
		chat.clearError()
		chat.messages = [];
	}

	function retry() {
		chat.clearError();
		chat.regenerate();
	}

	return {
		currentProvider,
		currentModel,
		addMessage,
		clearConversation,
		chat,
		messages,
		status,
		selectedModel,
		updateSelectedModel,
		models,
		error,
		retry,
	};
});
