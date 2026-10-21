import {
	buildCustomModelDefinition as buildCustomModelDefinitionBase,
	buildCustomModels as buildCustomModelsBase,
	DEFAULT_AI_MODELS,
	type ModelDefinition,
	type OpenAICompatibleModel,
	type ProviderType,
} from '@directus/ai';
import type { Component } from 'vue';
import LogoClaude from '@/ai/components/logos/claude.vue';
import LogoCustom from '@/ai/components/logos/custom.vue';
import LogoGoogle from '@/ai/components/logos/google.vue';
import LogoOpenAI from '@/ai/components/logos/openai.vue';
import LogoOpenRouter from '@/ai/components/logos/openrouter.vue';

export interface AppModelDefinition extends ModelDefinition {
	icon: Component;
}

const PROVIDER_ICONS: Record<ProviderType, Component> = {
	openai: LogoOpenAI,
	anthropic: LogoClaude,
	google: LogoGoogle,
	openrouter: LogoOpenRouter,
	'openai-compatible': LogoCustom,
};

export const AI_MODELS: AppModelDefinition[] = DEFAULT_AI_MODELS.map((m) => ({
	...m,
	icon: PROVIDER_ICONS[m.provider] ?? LogoCustom,
}));

export function buildCustomModels(
	customModels: OpenAICompatibleModel[] | null,
	provider: ProviderType = 'openai-compatible',
): AppModelDefinition[] {
	return buildCustomModelsBase(customModels, provider).map((m) => ({
		...m,
		icon: PROVIDER_ICONS[provider],
	}));
}

export function buildCustomModelDefinition(provider: ProviderType, modelId: string): AppModelDefinition {
	return {
		...buildCustomModelDefinitionBase(provider, modelId),
		icon: PROVIDER_ICONS[provider] ?? LogoCustom,
	};
}
