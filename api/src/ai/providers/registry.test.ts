import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAnthropicWithFileSupport } from './anthropic-file-support.js';
import { buildProviderConfigs, createAIProviderRegistry } from './registry.js';
import type { AISettings, ProviderConfig } from './types.js';

vi.mock('@ai-sdk/openai', () => ({
	createOpenAI: vi.fn(() => ({ languageModel: vi.fn() })),
}));

vi.mock('./anthropic-file-support.js', () => ({
	createAnthropicWithFileSupport: vi.fn(() => ({ languageModel: vi.fn() })),
}));

vi.mock('@ai-sdk/google', () => ({
	createGoogleGenerativeAI: vi.fn(() => ({ languageModel: vi.fn() })),
}));

vi.mock('@ai-sdk/openai-compatible', () => ({
	createOpenAICompatible: vi.fn(() => ({ languageModel: vi.fn() })),
}));

vi.mock('@openrouter/ai-sdk-provider', () => ({
	createOpenRouter: vi.fn(() => ({ languageModel: vi.fn() })),
}));

vi.mock('ai', () => ({
	createProviderRegistry: vi.fn(() => ({
		languageModel: vi.fn(),
	})),
}));

const baseSettings: AISettings = {
	ai_openai_api_key: null,
	ai_anthropic_api_key: null,
	ai_google_api_key: null,
	ai_openrouter_api_key: null,
	ai_openai_compatible_api_key: null,
	ai_openai_compatible_base_url: null,
	ai_openai_compatible_name: null,
	ai_openai_compatible_models: null,
	ai_openai_compatible_headers: null,
	ai_openai_allowed_models: [],
	ai_anthropic_allowed_models: [],
	ai_google_allowed_models: [],
	ai_openrouter_models: [],
	ai_system_prompt: null,
};

describe('buildProviderConfigs', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns empty array when no providers configured', () => {
		const configs = buildProviderConfigs(baseSettings);
		expect(configs).toEqual([]);
	});

	it('includes OpenAI when API key is set', () => {
		const configs = buildProviderConfigs({
			...baseSettings,
			ai_openai_api_key: 'sk-openai-key',
		});

		expect(configs).toHaveLength(1);
		expect(configs[0]).toEqual({ type: 'openai', apiKey: 'sk-openai-key' });
	});

	it('includes Anthropic when API key is set', () => {
		const configs = buildProviderConfigs({
			...baseSettings,
			ai_anthropic_api_key: 'sk-anthropic-key',
		});

		expect(configs).toHaveLength(1);
		expect(configs[0]).toEqual({ type: 'anthropic', apiKey: 'sk-anthropic-key' });
	});

	it('includes Google when API key is set', () => {
		const configs = buildProviderConfigs({
			...baseSettings,
			ai_google_api_key: 'google-api-key',
		});

		expect(configs).toHaveLength(1);
		expect(configs[0]).toEqual({ type: 'google', apiKey: 'google-api-key' });
	});

	it('includes OpenRouter when API key is set', () => {
		const configs = buildProviderConfigs({
			...baseSettings,
			ai_openrouter_api_key: 'sk-or-key',
		});

		expect(configs).toHaveLength(1);
		expect(configs[0]).toEqual({ type: 'openrouter', apiKey: 'sk-or-key' });
	});

	it('includes OpenAI-compatible when both API key and base URL are set', () => {
		const configs = buildProviderConfigs({
			...baseSettings,
			ai_openai_compatible_api_key: 'custom-key',
			ai_openai_compatible_base_url: 'http://localhost:11434/v1',
		});

		expect(configs).toHaveLength(1);

		expect(configs[0]).toEqual({
			type: 'openai-compatible',
			apiKey: 'custom-key',
			baseUrl: 'http://localhost:11434/v1',
		});
	});

	it('excludes OpenAI-compatible when only API key is set', () => {
		const configs = buildProviderConfigs({
			...baseSettings,
			ai_openai_compatible_api_key: 'custom-key',
		});

		expect(configs).toHaveLength(0);
	});

	it('includes OpenAI-compatible without an API key when only base URL is set', () => {
		const configs = buildProviderConfigs({
			...baseSettings,
			ai_openai_compatible_base_url: 'http://localhost:11434/v1',
		});

		expect(configs).toHaveLength(1);

		expect(configs[0]).toEqual({
			type: 'openai-compatible',
			apiKey: undefined,
			baseUrl: 'http://localhost:11434/v1',
		});
	});

	it('includes multiple providers when configured', () => {
		const configs = buildProviderConfigs({
			...baseSettings,
			ai_openai_api_key: 'sk-openai',
			ai_anthropic_api_key: 'sk-anthropic',
			ai_google_api_key: 'google-key',
			ai_openrouter_api_key: 'sk-or-key',
			ai_openai_compatible_api_key: 'custom-key',
			ai_openai_compatible_base_url: 'http://localhost:11434/v1',
		});

		expect(configs).toHaveLength(5);
		expect(configs.map((c) => c.type)).toEqual(['openai', 'anthropic', 'google', 'openrouter', 'openai-compatible']);
	});
});

describe('createAIProviderRegistry', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('creates registry with OpenAI provider', () => {
		const configs: ProviderConfig[] = [{ type: 'openai', apiKey: 'sk-test' }];
		createAIProviderRegistry(configs);
		expect(createOpenAI).toHaveBeenCalledWith({ apiKey: 'sk-test' });
	});

	it('creates registry with Anthropic provider', () => {
		const configs: ProviderConfig[] = [{ type: 'anthropic', apiKey: 'sk-anthropic' }];
		createAIProviderRegistry(configs);
		expect(createAnthropicWithFileSupport).toHaveBeenCalledWith('sk-anthropic');
	});

	it('creates registry with Google provider', () => {
		const configs: ProviderConfig[] = [{ type: 'google', apiKey: 'google-key' }];
		createAIProviderRegistry(configs);
		expect(createGoogleGenerativeAI).toHaveBeenCalledWith({ apiKey: 'google-key' });
	});

	it('creates registry with OpenRouter provider and Directus attribution', () => {
		const configs: ProviderConfig[] = [{ type: 'openrouter', apiKey: 'sk-or-key' }];
		createAIProviderRegistry(configs);

		expect(createOpenRouter).toHaveBeenCalledWith({
			apiKey: 'sk-or-key',
			appName: 'Directus',
			appUrl: 'https://directus.com',
		});
	});

	it('creates registry with OpenAI-compatible provider', () => {
		const configs: ProviderConfig[] = [
			{ type: 'openai-compatible', apiKey: 'custom-key', baseUrl: 'http://localhost:11434/v1' },
		];

		createAIProviderRegistry(configs);

		expect(createOpenAICompatible).toHaveBeenCalledWith({
			name: 'openai-compatible',
			apiKey: 'custom-key',
			baseURL: 'http://localhost:11434/v1',
			headers: {},
		});
	});

	it('uses custom name for OpenAI-compatible provider when provided in settings', () => {
		const configs: ProviderConfig[] = [
			{ type: 'openai-compatible', apiKey: 'custom-key', baseUrl: 'http://localhost:11434/v1' },
		];

		const settings: AISettings = {
			...baseSettings,
			ai_openai_compatible_api_key: 'custom-key',
			ai_openai_compatible_base_url: 'http://localhost:11434/v1',
			ai_openai_compatible_name: 'Ollama',
		};

		createAIProviderRegistry(configs, settings);
		expect(createOpenAICompatible).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ollama' }));
	});

	it('uses custom headers for OpenAI-compatible provider when provided in settings', () => {
		const configs: ProviderConfig[] = [
			{ type: 'openai-compatible', apiKey: 'custom-key', baseUrl: 'http://localhost:11434/v1' },
		];

		const settings: AISettings = {
			...baseSettings,
			ai_openai_compatible_api_key: 'custom-key',
			ai_openai_compatible_base_url: 'http://localhost:11434/v1',
			ai_openai_compatible_headers: [
				{ header: 'X-Custom-Header', value: 'custom-value' },
				{ header: 'Authorization', value: 'Bearer token123' },
			],
		};

		createAIProviderRegistry(configs, settings);

		expect(createOpenAICompatible).toHaveBeenCalledWith(
			expect.objectContaining({
				headers: {
					'X-Custom-Header': 'custom-value',
					Authorization: 'Bearer token123',
				},
			}),
		);
	});

	it('creates OpenAI-compatible provider without an API key', () => {
		const configs: ProviderConfig[] = [{ type: 'openai-compatible', baseUrl: 'http://localhost:11434/v1' }];

		createAIProviderRegistry(configs);

		expect(createOpenAICompatible).toHaveBeenCalledWith(
			expect.objectContaining({ apiKey: undefined, baseURL: 'http://localhost:11434/v1' }),
		);
	});

	it('skips OpenAI-compatible when baseUrl is missing', () => {
		const configs = [{ type: 'openai-compatible', apiKey: 'custom-key' }] as ProviderConfig[];
		createAIProviderRegistry(configs);
		expect(createOpenAICompatible).not.toHaveBeenCalled();
	});

	it('creates registry with multiple providers', () => {
		const configs: ProviderConfig[] = [
			{ type: 'openai', apiKey: 'sk-openai' },
			{ type: 'anthropic', apiKey: 'sk-anthropic' },
			{ type: 'google', apiKey: 'google-key' },
		];

		createAIProviderRegistry(configs);
		expect(createOpenAI).toHaveBeenCalledWith({ apiKey: 'sk-openai' });
		expect(createAnthropicWithFileSupport).toHaveBeenCalledWith('sk-anthropic');
		expect(createGoogleGenerativeAI).toHaveBeenCalledWith({ apiKey: 'google-key' });
	});
});
