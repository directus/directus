import { useLocalStorage, createEventHook } from '@vueuse/core';
import { defineStore } from 'pinia';
import { ref } from 'vue';

import { AI_MODELS } from '../models';

export const useAiStore = defineStore('ai-store', () => {

	const selectedModel = useLocalStorage<string | null>('selected-ai-model', AI_MODELS[0] ?? null);

	return {
		models: AI_MODELS,
		selectedModel,
	};
});
