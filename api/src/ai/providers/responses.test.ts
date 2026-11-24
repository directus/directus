import { generateText, jsonSchema, stepCountIs, streamText, tool } from 'ai';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getProviderOptions } from './options.js';
import { buildProviderConfigs, createAIProviderRegistry } from './registry.js';
import type { AISettings } from './types.js';

vi.mock('./anthropic-file-support.js', () => ({ createAnthropicWithFileSupport: vi.fn() }));

const settings: AISettings = {
	openaiApiKey: null,
	anthropicApiKey: null,
	googleApiKey: null,
	openaiCompatibleApiKey: 'test-key',
	openaiCompatibleBaseUrl: 'https://example.openai.azure.com/openai/v1/',
	openaiCompatibleName: 'Azure Foundry',
	openaiCompatibleHeaders: [{ header: 'X-Custom', value: 'test-header' }],
	openaiCompatibleModels: [
		{ id: 'legacy', name: 'Legacy' },
		{ id: 'chat', name: 'Chat', api: 'chat-completions' },
		{
			id: 'my-deployment',
			name: 'Sol',
			api: 'responses',
			reasoning: true,
			providerOptions: { reasoningEffort: 'high' },
		},
	],
	openaiAllowedModels: null,
	anthropicAllowedModels: null,
	googleAllowedModels: null,
	systemPrompt: null,
};

const usage = {
	input_tokens: 10,
	output_tokens: 8,
	total_tokens: 18,
	input_tokens_details: { cached_tokens: 0 },
	output_tokens_details: { reasoning_tokens: 3 },
};

const message = {
	type: 'message',
	id: 'msg_1',
	role: 'assistant',
	status: 'completed',
	content: [{ type: 'output_text', text: 'The answer is 42.', annotations: [] }],
};

function responsesOutput(output: unknown[]) {
	return new Response(
		JSON.stringify({
			id: 'resp_1',
			object: 'response',
			created_at: 1,
			status: 'completed',
			model: 'my-deployment',
			output,
			usage,
		}),
		{ headers: { 'content-type': 'application/json' } },
	);
}

afterEach(() => vi.unstubAllGlobals());

describe('custom provider Responses transport', () => {
	it.each(['legacy', 'chat', 'unlisted'])('keeps %s on Chat Completions in a mixed provider', async (id) => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(
				JSON.stringify({
					id: 'chat_1',
					object: 'chat.completion',
					created: 1,
					model: id,
					choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: 'Hello' } }],
					usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
				}),
				{ headers: { 'content-type': 'application/json' } },
			),
		);

		vi.stubGlobal('fetch', fetchMock);

		const registry = createAIProviderRegistry(buildProviderConfigs(settings), settings);
		const result = await generateText({ model: registry.languageModel(`openai-compatible:${id}`), prompt: 'Hello' });

		expect(result.text).toBe('Hello');
		expect(fetchMock.mock.calls[0]?.[0]).toBe(settings.openaiCompatibleBaseUrl + 'chat/completions');
	});

	it('executes a tool and replays encrypted reasoning using a custom deployment name', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				responsesOutput([
					{
						type: 'reasoning',
						id: 'rs_1',
						summary: [{ type: 'summary_text', text: 'Use lookup.' }],
						encrypted_content: 'encrypted-test-content',
					},
					{
						type: 'function_call',
						id: 'fc_1',
						call_id: 'call_1',
						name: 'lookup',
						arguments: '{}',
						status: 'completed',
					},
				]),
			)
			.mockResolvedValueOnce(responsesOutput([message]));

		vi.stubGlobal('fetch', fetchMock);

		const execute = vi.fn(async () => ({ answer: 42 }));
		const registry = createAIProviderRegistry(buildProviderConfigs(settings), settings);

		const result = await generateText({
			model: registry.languageModel('openai-compatible:my-deployment'),
			providerOptions: getProviderOptions('openai-compatible', 'my-deployment', settings),
			prompt: 'Look up the answer',
			stopWhen: stepCountIs(2),
			tools: {
				lookup: tool({
					inputSchema: jsonSchema({ type: 'object', properties: {}, additionalProperties: false }),
					execute,
				}),
			},
		});

		expect(result.text).toBe('The answer is 42.');
		expect(execute).toHaveBeenCalledOnce();
		expect(fetchMock).toHaveBeenCalledTimes(2);

		for (const [url, init] of fetchMock.mock.calls) {
			const headers = new Headers(init.headers);
			const body = JSON.parse(init.body);

			expect(url).toBe(settings.openaiCompatibleBaseUrl + 'responses');
			expect(headers.get('authorization')).toBe('Bearer test-key');
			expect(headers.get('X-Custom')).toBe('test-header');

			expect(body).toMatchObject({
				model: 'my-deployment',
				store: false,
				reasoning: { effort: 'high', summary: 'auto' },
			});

			expect(body.include).toContain('reasoning.encrypted_content');
		}

		const secondInput = JSON.parse(fetchMock.mock.calls[1]![1].body).input;

		expect(secondInput).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ type: 'function_call_output', call_id: 'call_1' }),
				expect.objectContaining({ type: 'reasoning', encrypted_content: 'encrypted-test-content' }),
			]),
		);

		expect(secondInput).not.toEqual(expect.arrayContaining([expect.objectContaining({ type: 'item_reference' })]));
	});

	it('streams Responses text', async () => {
		const events = [
			{ type: 'response.created', response: { id: 'resp_1', created_at: 1, model: 'my-deployment' } },
			{
				type: 'response.output_item.added',
				output_index: 0,
				item: { type: 'message', id: 'msg_1', role: 'assistant', content: [] },
			},
			{
				type: 'response.content_part.added',
				item_id: 'msg_1',
				output_index: 0,
				content_index: 0,
				part: { type: 'output_text', text: '', annotations: [] },
			},
			{
				type: 'response.output_text.delta',
				item_id: 'msg_1',
				output_index: 0,
				content_index: 0,
				delta: 'The answer is 42.',
			},
			{
				type: 'response.output_text.done',
				item_id: 'msg_1',
				output_index: 0,
				content_index: 0,
				text: 'The answer is 42.',
			},
			{ type: 'response.output_item.done', output_index: 0, item: message },
			{ type: 'response.completed', response: { id: 'resp_1', status: 'completed', usage } },
		];

		const fetchMock = vi.fn().mockResolvedValue(
			new Response(events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(''), {
				headers: { 'content-type': 'text/event-stream' },
			}),
		);

		vi.stubGlobal('fetch', fetchMock);

		const registry = createAIProviderRegistry(buildProviderConfigs(settings), settings);
		const onError = vi.fn();

		const result = streamText({
			model: registry.languageModel('openai-compatible:my-deployment'),
			providerOptions: getProviderOptions('openai-compatible', 'my-deployment', settings),
			prompt: 'Hello',
			onError,
		});

		expect(await result.text).toBe('The answer is 42.');
		expect(onError).not.toHaveBeenCalled();
		expect(JSON.parse(fetchMock.mock.calls[0]![1].body).stream).toBe(true);
	});
});
