import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildProviderConfigs, createAIProviderRegistry } from './registry.js';
import type { AISettings, ProviderConfig } from './types.js';

vi.mock('@ai-sdk/openai', () => ({
	createOpenAI: vi.fn(() => ({ languageModel: vi.fn() })),
}));

vi.mock('@ai-sdk/anthropic', () => ({
	createAnthropic: vi.fn(() => ({ languageModel: vi.fn() })),
}));

vi.mock('@ai-sdk/google', () => ({
	createGoogleGenerativeAI: vi.fn(() => ({ languageModel: vi.fn() })),
}));

vi.mock('@ai-sdk/openai-compatible', () => ({
	createOpenAICompatible: vi.fn(() => ({ languageModel: vi.fn() })),
}));

vi.mock('ai', () => ({
	createProviderRegistry: vi.fn(() => ({
		languageModel: vi.fn(),
	})),
}));

const baseSettings: AISettings = {
	openaiApiKey: null,
	anthropicApiKey: null,
	googleApiKey: null,
	openaiCompatibleApiKey: null,
	openaiCompatibleBaseUrl: null,
	openaiCompatibleName: null,
	openaiCompatibleModels: null,
	openaiCompatibleHeaders: null,
	openaiAllowedModels: null,
	anthropicAllowedModels: null,
	googleAllowedModels: null,
	systemPrompt: null,
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
			openaiApiKey: 'sk-openai-key',
		});

		expect(configs).toHaveLength(1);
		expect(configs[0]).toEqual({ type: 'openai', apiKey: 'sk-openai-key' });
	});

	it('includes Anthropic when API key is set', () => {
		const configs = buildProviderConfigs({
			...baseSettings,
			anthropicApiKey: 'sk-anthropic-key',
		});

		expect(configs).toHaveLength(1);
		expect(configs[0]).toEqual({ type: 'anthropic', apiKey: 'sk-anthropic-key' });
	});

	it('includes Google when API key is set', () => {
		const configs = buildProviderConfigs({
			...baseSettings,
			googleApiKey: 'google-api-key',
		});

		expect(configs).toHaveLength(1);
		expect(configs[0]).toEqual({ type: 'google', apiKey: 'google-api-key' });
	});

	it('includes OpenAI-compatible only when both API key and base URL are set', () => {
		const configs = buildProviderConfigs({
			...baseSettings,
			openaiCompatibleApiKey: 'custom-key',
			openaiCompatibleBaseUrl: 'http://localhost:11434/v1',
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
			openaiCompatibleApiKey: 'custom-key',
		});

		expect(configs).toHaveLength(0);
	});

	it('excludes OpenAI-compatible when only base URL is set', () => {
		const configs = buildProviderConfigs({
			...baseSettings,
			openaiCompatibleBaseUrl: 'http://localhost:11434/v1',
		});

		expect(configs).toHaveLength(0);
	});

	it('includes multiple providers when configured', () => {
		const configs = buildProviderConfigs({
			...baseSettings,
			openaiApiKey: 'sk-openai',
			anthropicApiKey: 'sk-anthropic',
			googleApiKey: 'google-key',
			openaiCompatibleApiKey: 'custom-key',
			openaiCompatibleBaseUrl: 'http://localhost:11434/v1',
		});

		expect(configs).toHaveLength(4);
		expect(configs.map((c) => c.type)).toEqual(['openai', 'anthropic', 'google', 'openai-compatible']);
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
		expect(createAnthropic).toHaveBeenCalledWith({ apiKey: 'sk-anthropic' });
	});

	it('creates registry with Google provider', () => {
		const configs: ProviderConfig[] = [{ type: 'google', apiKey: 'google-key' }];
		createAIProviderRegistry(configs);
		expect(createGoogleGenerativeAI).toHaveBeenCalledWith({ apiKey: 'google-key' });
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
			openaiCompatibleApiKey: 'custom-key',
			openaiCompatibleBaseUrl: 'http://localhost:11434/v1',
			openaiCompatibleName: 'Ollama',
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
			openaiCompatibleApiKey: 'custom-key',
			openaiCompatibleBaseUrl: 'http://localhost:11434/v1',
			openaiCompatibleHeaders: [
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
		expect(createAnthropic).toHaveBeenCalledWith({ apiKey: 'sk-anthropic' });
		expect(createGoogleGenerativeAI).toHaveBeenCalledWith({ apiKey: 'google-key' });
	});
});
