import { Readable } from 'node:stream';
import { AI_MAX_FILE_SIZE } from '@directus/ai';
import { InvalidPayloadError, ServiceUnavailableError } from '@directus/errors';
import { APICallError, RetryError, TypeValidationError } from 'ai';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { getAccountabilityForRole } from '../../utils/get-accountability-for-role.js';
import {
	getFileIds,
	getOperationAccountability,
	parseModelKey,
	readFilesForModel,
	readPrompt,
	toOperationError,
} from './utils.js';

const { warn } = vi.hoisted(() => ({ warn: vi.fn() }));

vi.mock('../../logger/index.js', () => ({
	useLogger: () => ({ warn }),
}));

vi.mock('../../utils/get-accountability-for-role.js', () => ({
	getAccountabilityForRole: vi.fn(async (role) => ({ role })),
}));

afterEach(() => {
	vi.clearAllMocks();
});

describe('parseModelKey', () => {
	test('splits the provider from the model id, keeping colons in the id', () => {
		expect(parseModelKey('openai:gpt-5')).toEqual({ provider: 'openai', model: 'gpt-5' });
		expect(parseModelKey('openai-compatible:llama3:8b')).toEqual({ provider: 'openai-compatible', model: 'llama3:8b' });
	});

	test('allows the characters real model ids use', () => {
		expect(parseModelKey('openai-compatible:hf.co/org/model:Q4_K_M@latest').model).toBe(
			'hf.co/org/model:Q4_K_M@latest',
		);
	});

	test.each(['gpt-5', 'mistral:large', 'openai:', '', null, undefined, 'google:../x', 'google:a?b', 'google:a#b'])(
		'rejects %s',
		(key) => {
			expect(() => parseModelKey(key)).toThrow(InvalidPayloadError);
		},
	);
});

describe('readPrompt', () => {
	test('keeps strings and turns other values into JSON', () => {
		expect(readPrompt('Hi')).toBe('Hi');
		expect(readPrompt({ a: 1 })).toBe('{"a":1}');
		expect(readPrompt(0)).toBe('0');
	});

	test.each([null, undefined, '', '  '])('rejects an empty prompt (%s)', (prompt) => {
		expect(() => readPrompt(prompt)).toThrow('"prompt" is required');
	});
});

describe('toOperationError', () => {
	const apiError = (statusCode?: number) =>
		new APICallError({
			message: 'Bad key sk-SECRET for PRIVATE PROMPT',
			url: 'https://api.example.com',
			requestBodyValues: { prompt: 'PRIVATE PROMPT' },
			...(statusCode ? { statusCode } : {}),
		});

	const asText = (error: unknown) => JSON.stringify(error) + (error as Error).message;

	test.each([
		[400, InvalidPayloadError, 'rejected the request (HTTP 400)'],
		[401, ServiceUnavailableError, 'refused the API key'],
		[429, ServiceUnavailableError, 'limiting requests'],
		[503, ServiceUnavailableError, 'failed (HTTP 503)'],
		[undefined, ServiceUnavailableError, "couldn't be reached"],
	])('maps HTTP %s to its own message, without the provider text', (status, type, message) => {
		const error = toOperationError(apiError(status), 'openai');

		expect(error).toBeInstanceOf(type);
		expect((error as Error).message).toContain(message);
		expect(asText(error)).not.toMatch(/SECRET|PRIVATE/);
	});

	test('logs the error name and status, not its message', () => {
		toOperationError(apiError(401), 'openai');

		expect(warn).toHaveBeenCalledWith(
			{ provider: 'openai', error: 'AI_APICallError', status: 401 },
			expect.any(String),
		);

		expect(JSON.stringify(warn.mock.calls)).not.toMatch(/SECRET|PRIVATE/);
	});

	test('reads the last attempt of a retried call', () => {
		const retry = new RetryError({ message: 'Failed', reason: 'maxRetriesExceeded', errors: [apiError(429)] });

		expect((toOperationError(retry, 'openai') as Error).message).toContain('limiting requests');
	});

	test('keeps a retry message out when the last error is not from the SDK', () => {
		const retry = new RetryError({
			message: 'Failed: PRIVATE PROMPT',
			reason: 'maxRetriesExceeded',
			errors: [new Error('PRIVATE PROMPT')],
		});

		expect(asText(toOperationError(retry, 'openai'))).not.toContain('PRIVATE');
	});

	test("keeps other SDK errors' messages out, since they can quote the reply", () => {
		const error = new TypeValidationError({ value: { secret: 'PRIVATE REPLY' }, cause: new Error('bad') });

		const result = toOperationError(error, 'openai');

		expect(result).toBeInstanceOf(InvalidPayloadError);
		expect(asText(result)).not.toContain('PRIVATE');
	});

	test('returns other errors unchanged', () => {
		const error = new Error('boom');

		expect(toOperationError(error, 'openai')).toBe(error);
	});
});

describe('getFileIds', () => {
	test('counts a repeated id once', () => {
		expect(getFileIds(['a', 'a', { id: 'a' }, 'b'])).toEqual(['a', 'b']);
	});

	test('reads ids from strings, arrays, and file objects', () => {
		expect(getFileIds('a, b,,c ')).toEqual(['a', 'b', 'c']);
		expect(getFileIds(['a', { id: 'b' }, 3])).toEqual(['a', 'b', '3']);
		expect(getFileIds({ id: 'a' })).toEqual(['a']);
	});

	test('returns nothing for empty values', () => {
		expect(getFileIds(null)).toEqual([]);
		expect(getFileIds(undefined)).toEqual([]);
		expect(getFileIds([null, {}, ''])).toEqual([]);
	});
});

describe('getOperationAccountability', () => {
	const context = { accountability: { user: 'user-1' }, database: {}, schema: {} } as any;

	test('uses the trigger accountability by default', async () => {
		expect(await getOperationAccountability(undefined, context)).toBe(context.accountability);
		expect(await getOperationAccountability('$trigger', context)).toBe(context.accountability);
		expect(getAccountabilityForRole).not.toHaveBeenCalled();
	});

	test.each([
		['$full', 'system'],
		['$public', null],
		['role-1', 'role-1'],
	])('maps %s to role %s', async (permissions, role) => {
		await getOperationAccountability(permissions, context);
		expect(getAccountabilityForRole).toHaveBeenCalledWith(role, context);
	});
});

describe('readFilesForModel', () => {
	function mockAssets(files: Record<string, { file: Record<string, unknown>; chunks?: Buffer[] }>) {
		const streams: Readable[] = [];

		const getAsset = vi.fn(async (id: string) => {
			const stream = Readable.from(files[id]!.chunks ?? []);
			vi.spyOn(stream, 'destroy');
			streams.push(stream);
			return { stream, file: files[id]!.file };
		});

		const destroyed = () => streams.some((stream) => vi.mocked(stream.destroy).mock.calls.length > 0);

		return { assets: { getAsset } as any, destroyed };
	}

	test('reads each file with its type and name', async () => {
		const { assets } = mockAssets({
			'file-1': {
				file: { type: 'image/png', filename_download: 'cat.png', width: 1600, height: 900 },
				chunks: [Buffer.from('ca'), Buffer.from('t')],
			},
		});

		expect(await readFilesForModel(assets, ['file-1'])).toEqual([
			{ data: Buffer.from('cat'), mediaType: 'image/png', filename: 'cat.png', width: 1600, height: 900 },
		]);
	});

	test('rejects types AI models cannot read and closes the stream', async () => {
		const { assets, destroyed } = mockAssets({ 'file-1': { file: { type: 'application/zip' } } });

		await expect(readFilesForModel(assets, ['file-1'])).rejects.toThrow(InvalidPayloadError);
		expect(destroyed()).toBe(true);
	});

	test('rejects more than 20 files before reading any', async () => {
		const { assets } = mockAssets({});
		const ids = Array.from({ length: 21 }, (_, index) => `file-${index}`);

		await expect(readFilesForModel(assets, ids)).rejects.toThrow('at most 20 files');
		expect(assets.getAsset).not.toHaveBeenCalled();
	});

	test('rejects types outside the allowed list', async () => {
		const { assets } = mockAssets({ 'file-1': { file: { type: 'application/pdf' } } });

		await expect(readFilesForModel(assets, ['file-1'], ['image/png'])).rejects.toThrow(InvalidPayloadError);
	});

	test('rejects files that add up to more than the size limit', async () => {
		const half = AI_MAX_FILE_SIZE / 2 + 1;

		const { assets, destroyed } = mockAssets({
			'file-1': { file: { type: 'image/png', filesize: half }, chunks: [Buffer.alloc(half)] },
			'file-2': { file: { type: 'image/png', filesize: half } },
		});

		await expect(readFilesForModel(assets, ['file-1', 'file-2'])).rejects.toThrow(InvalidPayloadError);
		expect(destroyed()).toBe(true);
	});

	test('counts bytes while reading when the file size is unknown', async () => {
		const { assets, destroyed } = mockAssets({
			'file-1': { file: { type: 'image/png', filesize: null }, chunks: [Buffer.alloc(AI_MAX_FILE_SIZE + 1)] },
		});

		await expect(readFilesForModel(assets, ['file-1'])).rejects.toThrow(InvalidPayloadError);
		expect(destroyed()).toBe(true);
	});
});
