import { Readable } from 'node:stream';
import { InvalidPayloadError } from '@directus/errors';
import { APICallError, generateText, NoObjectGeneratedError } from 'ai';
import { MockLanguageModelV3 } from 'ai/test';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getAISettings, resolveLanguageModel } from '../../ai/providers/index.js';
import config from './index.js';

const ALT_SCHEMA = { type: 'object', properties: { alt: { type: 'string' } }, required: ['alt'] };

vi.mock('ai', async (importOriginal) => ({
	...(await importOriginal<typeof import('ai')>()),
	generateText: vi.fn(),
}));

vi.mock('../../ai/providers/index.js', () => ({
	getAISettings: vi.fn(async () => ({})),
	resolveLanguageModel: vi.fn(() => ({ model: 'mock-model', providerOptions: {} })),
}));

vi.mock('../../logger/index.js', () => ({
	useLogger: () => ({ warn: vi.fn() }),
}));

vi.mock('../../ai/telemetry/index.js', () => ({
	getAITelemetryConfig: vi.fn(),
}));

const getAsset = vi.fn();

vi.mock('../../services/assets.js', () => ({
	AssetsService: vi.fn().mockImplementation(function () {
		return { getAsset };
	}),
}));

const context = {
	accountability: { user: 'user-1', role: 'role-1' },
	database: {},
	getSchema: vi.fn(async () => ({})),
} as any;

beforeEach(() => {
	vi.mocked(generateText).mockResolvedValue({
		text: 'A red bicycle',
		output: { alt: 'A red bicycle' },
		usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
		finishReason: 'stop',
		warnings: [],
	} as any);
});

afterEach(() => {
	vi.clearAllMocks();
	getAsset.mockReset();
});

describe('Operations / AI Text', () => {
	test('returns text from the resolved model', async () => {
		const result = await config.handler({ model: 'openai:gpt-5', prompt: 'Describe a bicycle' }, context);

		expect(getAISettings).toHaveBeenCalledWith({ knex: context.database, schema: {} });
		expect(resolveLanguageModel).toHaveBeenCalledWith('openai', 'gpt-5', {});

		expect(generateText).toHaveBeenCalledWith(
			expect.objectContaining({
				model: 'mock-model',
				messages: [{ role: 'user', content: [{ type: 'text', text: 'Describe a bicycle' }] }],
			}),
		);

		expect(result).toEqual(expect.objectContaining({ text: 'A red bicycle', model: 'openai:gpt-5' }));
	});

	test.each([
		['a model without a provider', { model: 'gpt-5', prompt: 'Hi' }],
		['an unsafe model id', { model: 'google:../files', prompt: 'Hi' }],
		['an empty prompt', { model: 'openai:gpt-5', prompt: '  ' }],
		['a missing prompt from the data chain', { model: 'openai:gpt-5', prompt: null }],
	])('rejects %s before calling the model', async (_, options) => {
		await expect(config.handler(options, context)).rejects.toThrow(InvalidPayloadError);
		expect(generateText).not.toHaveBeenCalled();
	});

	test('sends marker text that comes from flow data', async () => {
		await config.handler({ model: 'openai:gpt-5', prompt: 'Moderate this:\n\n[your content]' }, context);

		expect(generateText).toHaveBeenCalled();
	});

	test('passes a valid max output tokens and ignores an invalid one', async () => {
		await config.handler({ model: 'openai:gpt-5', prompt: 'Hi', maxOutputTokens: '200' as any }, context);
		await config.handler({ model: 'openai:gpt-5', prompt: 'Hi', maxOutputTokens: 'lots' as any }, context);

		expect(vi.mocked(generateText).mock.calls[0]![0]).toHaveProperty('maxOutputTokens', 200);
		expect(vi.mocked(generateText).mock.calls[1]![0]).not.toHaveProperty('maxOutputTokens');
	});

	test('returns an object matching the schema', async () => {
		const result = await config.handler(
			{ model: 'openai:gpt-5', prompt: 'Describe', output: 'object', schema: ALT_SCHEMA },
			context,
		);

		expect(vi.mocked(generateText).mock.calls[0]![0]).toHaveProperty('output');
		expect(result).toEqual(expect.objectContaining({ output: { alt: 'A red bicycle' } }));
		expect(result).not.toHaveProperty('text');
	});

	test('uses native structured output for Claude', async () => {
		await config.handler(
			{ model: 'anthropic:claude-sonnet-5-5', prompt: 'Describe', output: 'object', schema: ALT_SCHEMA },
			context,
		);

		expect(vi.mocked(generateText).mock.calls[0]![0].providerOptions).toEqual({
			anthropic: { structuredOutputMode: 'outputFormat' },
		});
	});

	test('explains a reply cut off by the token limit before it started', async () => {
		vi.mocked(generateText).mockResolvedValueOnce({
			text: '',
			usage: { inputTokens: 10, outputTokens: 400, totalTokens: 410 },
			finishReason: 'length',
			warnings: [],
		} as any);

		await expect(
			config.handler({ model: 'anthropic:claude-sonnet-5-5', prompt: 'Hi', maxOutputTokens: 400 }, context),
		).rejects.toThrow('Max Output Tokens');
	});

	test('explains the model hitting its own limit when Max Output Tokens is empty', async () => {
		vi.mocked(generateText).mockResolvedValueOnce({ text: '', finishReason: 'length', warnings: [] } as any);

		await expect(config.handler({ model: 'openai:gpt-5', prompt: 'Hi' }, context)).rejects.toThrow(
			"longer than the model's output limit",
		);
	});

	test('rejects an empty reply, like one stopped by a content filter', async () => {
		vi.mocked(generateText).mockResolvedValueOnce({ text: '', finishReason: 'content-filter', warnings: [] } as any);

		await expect(config.handler({ model: 'openai:gpt-5', prompt: 'Hi' }, context)).rejects.toThrow(
			'empty reply (finish reason "content-filter")',
		);
	});

	test('keeps the request out of provider errors', async () => {
		vi.mocked(generateText).mockRejectedValueOnce(
			new APICallError({
				message: 'Rejected request',
				url: 'https://api.openai.com/v1/responses',
				requestBodyValues: { input: 'PRIVATE PROMPT' },
				statusCode: 400,
				responseBody: '{"error":"PRIVATE PROMPT"}',
			}),
		);

		const handler = config.handler({ model: 'openai:gpt-5', prompt: 'Hi' }, context) as Promise<unknown>;
		const error: any = await handler.catch((error) => error);

		expect(error).toBeInstanceOf(InvalidPayloadError);
		expect(error.message).toContain('The provider rejected the request (HTTP 400)');
		expect(JSON.stringify(error)).not.toContain('PRIVATE PROMPT');
	});

	test('explains an object reply cut off by the token limit', async () => {
		vi.mocked(generateText).mockRejectedValueOnce(
			new NoObjectGeneratedError({
				message: 'No object generated',
				text: '{"alt": "A red',
				response: {} as any,
				usage: {} as any,
				finishReason: 'length',
			}),
		);

		await expect(
			config.handler(
				{ model: 'openai:gpt-5', prompt: 'Describe', output: 'object', schema: ALT_SCHEMA, maxOutputTokens: 400 },
				context,
			),
		).rejects.toThrow('Max Output Tokens');
	});

	test('rejects a reply that does not match the schema', async () => {
		await config.handler(
			{ model: 'openai:gpt-5', prompt: 'Describe', output: 'object', schema: JSON.stringify(ALT_SCHEMA) },
			context,
		);

		const output = vi.mocked(generateText).mock.calls[0]![0].output!;
		const parse = (text: string) => output.parseCompleteOutput({ text }, {} as any);

		await expect(parse('{"alt":"A red bicycle"}')).resolves.toEqual({ alt: 'A red bicycle' });
		await expect(parse('{"wrong":42}')).rejects.toThrow();
	});

	test('rejects schemas Zod cannot read before calling the model', async () => {
		const schema = {
			type: 'object',
			properties: { a: { $ref: '#/definitions/a' } },
			definitions: { a: { type: 'string' } },
		};

		await expect(
			config.handler({ model: 'openai:gpt-5', prompt: 'Describe', output: 'object', schema }, context),
		).rejects.toThrow('Put definitions in $defs, or inline');

		expect(generateText).not.toHaveBeenCalled();
	});

	test('makes optional keys required and nullable', async () => {
		const schema = {
			type: 'object',
			properties: { a: { type: 'string' }, b: { type: 'object', properties: { c: { type: 'number' } } } },
			required: ['a'],
		};

		await config.handler({ model: 'openai:gpt-5', prompt: 'Describe', output: 'object', schema }, context);

		const output = vi.mocked(generateText).mock.calls[0]![0].output!;
		const parse = (text: string) => output.parseCompleteOutput({ text }, {} as any);

		await expect(parse('{"a":"x","b":null}')).resolves.toEqual({ a: 'x', b: null });
		await expect(parse('{"a":"x","b":{"c":null}}')).resolves.toEqual({ a: 'x', b: { c: null } });
		await expect(parse('{"a":"x"}')).rejects.toThrow();
	});

	test('leaves regex patterns to the provider', async () => {
		const schema = {
			type: 'object',
			properties: { pattern: { type: 'string', pattern: '^(a+)+$' } },
			required: ['pattern'],
		};

		await config.handler({ model: 'openai:gpt-5', prompt: 'Describe', output: 'object', schema }, context);

		const output = vi.mocked(generateText).mock.calls[0]![0].output!;
		const sent = (await output.responseFormat) as any;

		expect(sent.schema.properties.pattern.pattern).toBe('^(a+)+$');

		await expect(
			output.parseCompleteOutput({ text: `{"pattern":"${'a'.repeat(40)}!"}` }, {} as any),
		).resolves.toBeTruthy();
	});

	test.each([
		['missing', null],
		['invalid JSON', 'not json'],
		['not an object', { type: 'array', items: { type: 'string' } }],
		['without properties', { type: 'object', properties: {} }],
	])('rejects a schema that is %s', async (_, schema) => {
		await expect(
			config.handler({ model: 'openai:gpt-5', prompt: 'Describe', output: 'object', schema }, context),
		).rejects.toThrow(InvalidPayloadError);

		expect(generateText).not.toHaveBeenCalled();
	});

	test('sends files as file parts', async () => {
		getAsset.mockResolvedValue({ stream: Readable.from([Buffer.from('img')]), file: { type: 'image/png' } });

		await config.handler({ model: 'openai:gpt-5', prompt: 'Describe', files: ['file-1'] }, context);

		expect(getAsset).toHaveBeenCalledWith('file-1');
		expect(getMessageContent()[1]).toEqual({ type: 'file', data: Buffer.from('img'), mediaType: 'image/png' });
	});

	test('sends text files as text', async () => {
		getAsset.mockResolvedValue({
			stream: Readable.from([Buffer.from('Hello')]),
			file: { type: 'text/plain', filename_download: 'notes.txt' },
		});

		await config.handler({ model: 'openai:gpt-5', prompt: 'Summarize', files: ['file-1'] }, context);

		expect(getMessageContent()[1]).toEqual({ type: 'text', text: 'notes.txt:\nHello' });
	});

	test('rejects files the model cannot read before calling it', async () => {
		getAsset.mockResolvedValue({ stream: Readable.from([]), file: { type: 'application/zip' } });

		await expect(
			config.handler({ model: 'openai:gpt-5', prompt: 'Describe', files: ['file-1'] }, context),
		).rejects.toThrow(InvalidPayloadError);

		expect(generateText).not.toHaveBeenCalled();
	});

	describe('with the real SDK', () => {
		/** Runs the real `generateText` against a model that replies with `text` and `finishReason`. */
		async function run(schema: any, text: string, finishReason = 'stop') {
			const actual = await vi.importActual<typeof import('ai')>('ai');
			vi.mocked(generateText).mockImplementationOnce(actual.generateText as any);

			const model = new MockLanguageModelV3({
				doGenerate: async () => ({
					content: text ? [{ type: 'text', text }] : [],
					finishReason: { unified: finishReason as any, raw: finishReason },
					usage: { inputTokens: { total: 1 }, outputTokens: { total: 1 } } as any,
					warnings: [],
				}),
			});

			vi.mocked(resolveLanguageModel).mockReturnValueOnce({ model, providerOptions: {} } as any);

			return config.handler({ model: 'openai:gpt-5', prompt: 'Describe', output: 'object', schema }, context);
		}

		test('explains an empty object reply', async () => {
			await expect(run(ALT_SCHEMA, '')).rejects.toThrow('empty reply (finish reason "stop")');
		});

		test('explains a reply that ended without an object', async () => {
			await expect(run(ALT_SCHEMA, '{"alt":"x"}', 'tool-calls')).rejects.toThrow('returned no object');
		});

		test('names the fields that did not match, without their values', async () => {
			const error: any = await (run(ALT_SCHEMA, '{"alt":424242}') as Promise<unknown>).catch((error) => error);

			expect(error.message).toContain("didn't match the output schema (alt:");
			expect(error.message).not.toContain('424242');
		});

		test('leaves extra keys from the reply out of the error', async () => {
			const error: any = await (run(ALT_SCHEMA, '{"alt":"a","PRIVATE_KEY":"b"}') as Promise<unknown>).catch(
				(error) => error,
			);

			expect(error.message).toContain('has fields the schema does not list');
			expect(error.message).not.toContain('PRIVATE');
		});

		test('accepts keys allowed by patternProperties', async () => {
			const schema = { ...ALT_SCHEMA, patternProperties: { '^x_': { type: 'string' } } };

			await expect(run(schema, '{"alt":"a","x_1":"b"}')).resolves.toEqual(
				expect.objectContaining({ output: { alt: 'a', x_1: 'b' } }),
			);
		});

		test('does not fill a missing required key from a default', async () => {
			const schema = {
				type: 'object',
				properties: { code: { type: 'string', enum: ['deny'], default: 'allow' } },
				required: ['code'],
			};

			await expect(run(schema, '{}')).rejects.toThrow("didn't match the output schema");
		});

		test('makes optional keys under $defs nullable', async () => {
			const schema = {
				type: 'object',
				properties: { person: { $ref: '#/$defs/person' } },
				required: ['person'],
				$defs: {
					person: {
						type: 'object',
						properties: { name: { type: 'string' }, email: { type: 'string' } },
						required: ['name'],
					},
				},
			};

			await expect(run(schema, '{"person":{"name":"a","email":null}}')).resolves.toEqual(
				expect.objectContaining({ output: { person: { name: 'a', email: null } } }),
			);
		});
	});

	test('leaves keys that already allow null as they are', async () => {
		const schema = {
			type: 'object',
			properties: { a: { type: ['string', 'null'] }, b: { type: 'string' } },
			required: ['b'],
		};

		await config.handler({ model: 'openai:gpt-5', prompt: 'Describe', output: 'object', schema }, context);

		const output = vi.mocked(generateText).mock.calls[0]![0].output!;
		const sent = (await output.responseFormat) as any;

		expect(sent.schema.properties.a).toEqual({ type: ['string', 'null'] });
		expect(sent.schema.required).toEqual(['a', 'b']);
	});

	test('rejects a __proto__ field before calling the model', async () => {
		const schema = { type: 'object', properties: JSON.parse('{"__proto__":{"type":"string"}}') };

		await expect(
			config.handler({ model: 'openai:gpt-5', prompt: 'Describe', output: 'object', schema }, context),
		).rejects.toThrow(`"__proto__" can't be an output field name`);

		expect(generateText).not.toHaveBeenCalled();
	});

	test('rejects a schema with a null property and a non-list required before calling the model', async () => {
		const schema = { type: 'object', properties: { a: null, b: { type: 'string' } }, required: 'b' };

		await expect(
			config.handler({ model: 'openai:gpt-5', prompt: 'Describe', output: 'object', schema }, context),
		).rejects.toThrow(InvalidPayloadError);

		expect(generateText).not.toHaveBeenCalled();
	});
});

function getMessageContent() {
	return vi.mocked(generateText).mock.calls[0]![0].messages![0]!.content as any[];
}
