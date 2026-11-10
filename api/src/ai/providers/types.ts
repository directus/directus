import type { OpenAICompatibleHeader, OpenAICompatibleModel, OpenRouterModel } from '@directus/ai';

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

/** AI settings as stored in `directus_settings`, with API keys decrypted. */
export interface AISettings {
	ai_openai_api_key: string | null;
	ai_anthropic_api_key: string | null;
	ai_google_api_key: string | null;
	ai_openrouter_api_key: string | null;
	ai_openai_compatible_api_key: string | null;
	ai_openai_compatible_base_url: string | null;
	ai_openai_compatible_name: string | null;
	ai_openai_compatible_models: OpenAICompatibleModel[] | null;
	ai_openai_compatible_headers: OpenAICompatibleHeader[] | null;
	ai_openai_allowed_models: string[] | null;
	ai_anthropic_allowed_models: string[] | null;
	ai_google_allowed_models: string[] | null;
	ai_openrouter_models: OpenRouterModel[] | null;
	ai_system_prompt: string | null;
}
