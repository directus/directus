import { ForbiddenError, ServiceUnavailableError } from '@directus/errors';
import { type LanguageModelMiddleware, wrapLanguageModel } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { validateModelAllowed } from '../chat/utils/validate-model-allowed.js';
import { getDevToolsMiddleware } from '../devtools/index.js';
import { getProviderOptions } from './options.js';
import { buildProviderConfigs, createAIProviderRegistry } from './registry.js';
import { resolveLanguageModel } from './resolve-model.js';
import type { AISettings } from './types.js';

vi.mock('ai', () => ({
	wrapLanguageModel: vi.fn(() => 'wrapped-model'),
}));

vi.mock('../chat/utils/validate-model-allowed.js', () => ({
	validateModelAllowed: vi.fn(),
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

const settings = { ai_openai_api_key: 'test-key' } as AISettings;
const languageModel = vi.fn(() => 'mock-model');

beforeEach(() => {
	vi.clearAllMocks();

	vi.mocked(buildProviderConfigs).mockReturnValue([
		{ type: 'anthropic', apiKey: 'other-key' },
		{ type: 'openai', apiKey: 'test-key' },
	]);

	vi.mocked(createAIProviderRegistry).mockReturnValue({ languageModel } as unknown as ReturnType<
		typeof createAIProviderRegistry
	>);

	vi.mocked(getProviderOptions).mockReturnValue({ openai: { store: false } });
	vi.mocked(getDevToolsMiddleware).mockReturnValue(null);
});

describe('resolveLanguageModel', () => {
	it('returns the model and provider options, building only the requested provider', () => {
		const result = resolveLanguageModel('openai', 'gpt-5', settings);

		expect(validateModelAllowed).toHaveBeenCalledWith('openai', 'gpt-5', settings);
		expect(createAIProviderRegistry).toHaveBeenCalledWith([{ type: 'openai', apiKey: 'test-key' }], settings);
		expect(languageModel).toHaveBeenCalledWith('openai:gpt-5');
		expect(getProviderOptions).toHaveBeenCalledWith('openai', 'gpt-5', settings);
		expect(result).toEqual({ model: 'mock-model', providerOptions: { openai: { store: false } } });
	});

	it('throws before building the model when the model is not allowed', () => {
		vi.mocked(validateModelAllowed).mockImplementationOnce(() => {
			throw new ForbiddenError({ reason: 'Model not allowed for this provider' });
		});

		expect(() => resolveLanguageModel('openai', 'gpt-4o', settings)).toThrow(ForbiddenError);
		expect(createAIProviderRegistry).not.toHaveBeenCalled();
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
