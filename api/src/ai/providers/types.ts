import type { Settings } from '@directus/types';
import type { AI_SETTINGS_FIELDS } from './settings.js';

interface OpenAIConfig {
	type: 'openai';
	apiKey: string;
}

interface AnthropicConfig {
	type: 'anthropic';
	apiKey: string;
}

interface GoogleConfig {
	type: 'google';
	apiKey: string;
}

interface OpenRouterConfig {
	type: 'openrouter';
	apiKey: string;
}

interface OpenAICompatibleConfig {
	type: 'openai-compatible';
	apiKey: string;
	baseUrl: string;
}

export type ProviderConfig = OpenAIConfig | AnthropicConfig | GoogleConfig | OpenRouterConfig | OpenAICompatibleConfig;

type AISettingsField = (typeof AI_SETTINGS_FIELDS)[number];
type AIApiKeyField = Extract<AISettingsField, `${string}_api_key`>;

/** AI settings as stored in `directus_settings`. `Settings` masks the API keys, these have them decrypted. */
export type AISettings = Omit<Pick<Settings, AISettingsField>, AIApiKeyField> & Record<AIApiKeyField, string | null>;
