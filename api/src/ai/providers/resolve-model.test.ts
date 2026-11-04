import { ServiceUnavailableError } from '@directus/errors';
import { type LanguageModelMiddleware, wrapLanguageModel } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDevToolsMiddleware } from '../devtools/index.js';
import { getProviderOptions } from './options.js';
import { buildProviderConfigs, createAIProviderRegistry } from './registry.js';
import { resolveLanguageModel } from './resolve-model.js';
import type { AISettings } from './types.js';

vi.mock('ai', () => ({
	wrapLanguageModel: vi.fn(() => 'wrapped-model'),
}));

vi.mock('../devtools/index.js', () => ({
	getDevToolsMiddleware: vi.fn(),
}));

vi.mock('./options.js', () => ({
	getProviderOptions: vi.fn(),
}));

vi.mock('./registry.js', () => ({
	buildProviderConfigs: vi.fn(),
	createAIProviderRegistry: vi.fn(),
}));

const settings = { openaiApiKey: 'test-key' } as AISettings;
const languageModel = vi.fn(() => 'mock-model');

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(buildProviderConfigs).mockReturnValue([{ type: 'openai', apiKey: 'test-key' }]);

	vi.mocked(createAIProviderRegistry).mockReturnValue({ languageModel } as unknown as ReturnType<
		typeof createAIProviderRegistry
	>);

	vi.mocked(getProviderOptions).mockReturnValue({ openai: { store: false } });
	vi.mocked(getDevToolsMiddleware).mockReturnValue(null);
});

describe('resolveLanguageModel', () => {
	it('returns the registry model and provider options', () => {
		const result = resolveLanguageModel('openai', 'gpt-5', settings);

		expect(createAIProviderRegistry).toHaveBeenCalledWith([{ type: 'openai', apiKey: 'test-key' }], settings);
		expect(languageModel).toHaveBeenCalledWith('openai:gpt-5');
		expect(getProviderOptions).toHaveBeenCalledWith('openai', 'gpt-5', settings);
		expect(result).toEqual({ model: 'mock-model', providerOptions: { openai: { store: false } } });
	});

	it('throws ServiceUnavailableError when the provider has no API key', () => {
		vi.mocked(buildProviderConfigs).mockReturnValue([]);

		expect(() => resolveLanguageModel('openai', 'gpt-5', settings)).toThrow(ServiceUnavailableError);
		expect(createAIProviderRegistry).not.toHaveBeenCalled();
	});

	it('wraps the model with devtools middleware when available', () => {
		const middleware: LanguageModelMiddleware = { specificationVersion: 'v3', wrapGenerate: vi.fn() };
		vi.mocked(getDevToolsMiddleware).mockReturnValue(middleware);

		const result = resolveLanguageModel('openai', 'gpt-5', settings);

		expect(wrapLanguageModel).toHaveBeenCalledWith({ model: 'mock-model', middleware });
		expect(result.model).toBe('wrapped-model');
	});

	it('does not wrap the model when devtools middleware is not available', () => {
		resolveLanguageModel('openai', 'gpt-5', settings);

		expect(wrapLanguageModel).not.toHaveBeenCalled();
	});
});
