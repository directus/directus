import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const catalog = {
	data: [
		{
			id: 'openai/gpt-6-luna',
			name: 'OpenAI: GPT-6 Luna',
			context_length: 1_050_000,
			top_provider: { max_completion_tokens: 128_000 },
		},
		{
			id: 'openai/gpt-6-luna:batch',
			name: 'OpenAI: GPT-6 Luna (batch)',
			context_length: 1_050_000,
			top_provider: { max_completion_tokens: 128_000 },
		},
		{
			id: 'meta-llama/llama-3.3-70b-instruct:free',
			name: 'Meta: Llama 3.3 70B Instruct (free)',
			context_length: 131_072,
			top_provider: { max_completion_tokens: null },
		},
		{ id: 'anthropic/claude-sonnet-5.5', name: 'Anthropic: Claude Sonnet 5.5', context_length: 1_000_000 },
	],
};

const fetchMock = vi.fn();

beforeEach(() => {
	vi.resetModules();
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('fetchOpenRouterModels', () => {
	test('fetches tool-capable models by popularity and drops batch variants', async () => {
		fetchMock.mockResolvedValue({ ok: true, json: async () => catalog });
		const { fetchOpenRouterModels } = await import('./openrouter-models');

		const models = await fetchOpenRouterModels();

		expect(fetchMock).toHaveBeenCalledWith(
			'https://openrouter.ai/api/v1/models?supported_parameters=tools&sort=most-popular',
		);

		expect(models).toEqual([
			{ id: 'openai/gpt-6-luna', name: 'OpenAI: GPT-6 Luna', context: 1_050_000, output: 128_000 },
			{
				id: 'meta-llama/llama-3.3-70b-instruct:free',
				name: 'Meta: Llama 3.3 70B Instruct (free)',
				context: 131_072,
			},
			{ id: 'anthropic/claude-sonnet-5.5', name: 'Anthropic: Claude Sonnet 5.5', context: 1_000_000 },
		]);
	});

	test('fetches once across calls', async () => {
		fetchMock.mockResolvedValue({ ok: true, json: async () => catalog });
		const { fetchOpenRouterModels } = await import('./openrouter-models');

		await fetchOpenRouterModels();
		await fetchOpenRouterModels();

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	test('resolves to an empty list on network error and retries next call', async () => {
		fetchMock.mockRejectedValueOnce(new Error('blocked by CSP'));
		fetchMock.mockResolvedValueOnce({ ok: true, json: async () => catalog });
		const { fetchOpenRouterModels } = await import('./openrouter-models');

		expect(await fetchOpenRouterModels()).toEqual([]);
		expect(await fetchOpenRouterModels()).toHaveLength(3);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	test('resolves to an empty list on a non-200 response', async () => {
		fetchMock.mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });
		const { fetchOpenRouterModels } = await import('./openrouter-models');

		expect(await fetchOpenRouterModels()).toEqual([]);
	});
});

describe('toSavedModel', () => {
	test('saves the catalog name without the vendor and its limits', async () => {
		const { toSavedModel } = await import('./openrouter-models');

		const catalogModels = [
			{ id: 'openai/gpt-6-luna', name: 'OpenAI: GPT-6 Luna', context: 1_050_000, output: 128_000 },
			{ id: 'acme/model', name: 'Acme: Model', context: 32_000 },
		];

		expect(toSavedModel('openai/gpt-6-luna', catalogModels)).toEqual({
			id: 'openai/gpt-6-luna',
			name: 'GPT-6 Luna',
			context: 1_050_000,
			output: 128_000,
		});

		expect(toSavedModel('acme/model', catalogModels)).toEqual({ id: 'acme/model', name: 'Model', context: 32_000 });
	});

	test('formats the id for models missing from the catalog', async () => {
		const { toSavedModel } = await import('./openrouter-models');

		expect(toSavedModel('acme/private-model', [])).toEqual({ id: 'acme/private-model', name: 'Private Model' });

		expect(toSavedModel('acme/llama-4-70b:free', [])).toEqual({
			id: 'acme/llama-4-70b:free',
			name: 'Llama 4 70b (Free)',
		});
	});
});
