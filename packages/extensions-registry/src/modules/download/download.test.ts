import ky from 'ky';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { assertVersionCompatibility } from '../../utils/assert-version-compatibility.js';
import { download } from './download.js';
import { constructUrl } from './lib/construct-url.js';

vi.mock('ky');
vi.mock('../../utils/assert-version-compatibility.js');
vi.mock('./lib/construct-url.js');

describe('download', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('Calls assertVersionCompatibility with provided options', async () => {
		const options = { registry: 'https://custom-registry.example.com' };
		const mockResponse = { body: new ReadableStream() };

		vi.mocked(constructUrl).mockReturnValue(new URL('http://example.com/download/test'));
		vi.mocked(ky.get).mockResolvedValue(mockResponse as any);

		await download('test-version', false, options);

		expect(assertVersionCompatibility).toHaveBeenCalledWith(options);
	});

	test('Calls assertVersionCompatibility with undefined when no options provided', async () => {
		const mockResponse = { body: new ReadableStream() };

		vi.mocked(constructUrl).mockReturnValue(new URL('http://example.com/download/test'));
		vi.mocked(ky.get).mockResolvedValue(mockResponse as any);

		await download('test-version');

		expect(assertVersionCompatibility).toHaveBeenCalledWith(undefined);
	});

	test('Throws if version compatibility assertion throws', async () => {
		const compatibilityError = new Error('Version compatibility failed');

		vi.mocked(assertVersionCompatibility).mockRejectedValue(compatibilityError);

		await expect(() => download('test-version')).rejects.toBe(compatibilityError);
	});

	test('Constructs URL with correct parameters', async () => {
		const versionId = 'test-extension-v1.0.0';
		const requireSandbox = true;
		const options = { registry: 'https://custom-registry.example.com' };
		const mockResponse = { body: new ReadableStream() };

		vi.mocked(assertVersionCompatibility).mockResolvedValue();
		vi.mocked(constructUrl).mockReturnValue(new URL('http://example.com/download/test'));
		vi.mocked(ky.get).mockResolvedValue(mockResponse as any);

		await download(versionId, requireSandbox, options);

		expect(constructUrl).toHaveBeenCalledWith(versionId, requireSandbox, options);
	});

	test('Constructs URL with default parameters when not provided', async () => {
		const versionId = 'test-extension-v1.0.0';
		const mockResponse = { body: new ReadableStream() };

		vi.mocked(assertVersionCompatibility).mockResolvedValue();
		vi.mocked(constructUrl).mockReturnValue(new URL('http://example.com/download/test'));
		vi.mocked(ky.get).mockResolvedValue(mockResponse as any);

		await download(versionId);

		expect(constructUrl).toHaveBeenCalledWith(versionId, false, undefined);
	});

	test('Fetches constructed URL using ky.get', async () => {
		const mockUrl = new URL('http://example.com/download/test-version');
		const mockResponse = { body: new ReadableStream() };

		vi.mocked(assertVersionCompatibility).mockResolvedValue();
		vi.mocked(constructUrl).mockReturnValue(mockUrl);
		vi.mocked(ky.get).mockResolvedValue(mockResponse as any);

		await download('test-version');

		expect(ky.get).toHaveBeenCalledWith(mockUrl);
	});

	test('Returns response body from ky.get', async () => {
		const mockBody = new ReadableStream();
		const mockResponse = { body: mockBody };

		vi.mocked(assertVersionCompatibility).mockResolvedValue();
		vi.mocked(constructUrl).mockReturnValue(new URL('http://example.com/download/test'));
		vi.mocked(ky.get).mockResolvedValue(mockResponse as any);

		const result = await download('test-version');

		expect(result).toBe(mockBody);
	});

	test('Propagates HTTP errors from ky.get', async () => {
		const httpError = new Error('Network error');

		vi.mocked(assertVersionCompatibility).mockResolvedValue();
		vi.mocked(constructUrl).mockReturnValue(new URL('http://example.com/download/test'));

		vi.mocked(ky.get).mockImplementation(() => {
			throw httpError;
		});

		await expect(() => download('test-version')).rejects.toBe(httpError);
	});

	test('Handles different version ID formats', async () => {
		const testCases = [
			'simple-extension-v1.0.0',
			'@scoped/extension-v2.1.0-beta.1',
			'extension_with_underscores-v0.1.0',
			'extension-with-dashes-v1.0.0-alpha',
		];

		const mockResponse = { body: new ReadableStream() };

		for (const versionId of testCases) {
			vi.mocked(assertVersionCompatibility).mockResolvedValue();
			vi.mocked(constructUrl).mockReturnValue(new URL(`http://example.com/download/${versionId}`));
			vi.mocked(ky.get).mockResolvedValue(mockResponse as any);

			const result = await download(versionId);

			expect(constructUrl).toHaveBeenCalledWith(versionId, false, undefined);
			expect(result).toBe(mockResponse.body);

			vi.clearAllMocks();
		}
	});

	test('Works with different registry options', async () => {
		const registryOptions = [
			{ registry: 'https://registry.directus.io' },
			{ registry: 'https://custom-registry.example.com' },
			{ registry: 'http://localhost:3000' },
		];

		const mockResponse = { body: new ReadableStream() };

		for (const options of registryOptions) {
			vi.mocked(assertVersionCompatibility).mockResolvedValue();
			vi.mocked(constructUrl).mockReturnValue(new URL('http://example.com/download/test'));
			vi.mocked(ky.get).mockResolvedValue(mockResponse as any);

			const result = await download('test-version', false, options);

			expect(constructUrl).toHaveBeenCalledWith('test-version', false, options);
			expect(result).toBe(mockResponse.body);

			vi.clearAllMocks();
		}
	});

	test('Works with different sandbox mode values', async () => {
		const sandboxValues = [true, false];
		const mockResponse = { body: new ReadableStream() };

		for (const requireSandbox of sandboxValues) {
			vi.mocked(assertVersionCompatibility).mockResolvedValue();
			vi.mocked(constructUrl).mockReturnValue(new URL('http://example.com/download/test'));
			vi.mocked(ky.get).mockResolvedValue(mockResponse as any);

			const result = await download('test-version', requireSandbox);

			expect(constructUrl).toHaveBeenCalledWith('test-version', requireSandbox, undefined);
			expect(result).toBe(mockResponse.body);

			vi.clearAllMocks();
		}
	});

	test('Combines all parameters correctly', async () => {
		const versionId = 'complex-extension-v2.1.0';
		const requireSandbox = true;
		const options = { registry: 'https://enterprise-registry.directus.io' };
		const mockBody = new ReadableStream();
		const mockResponse = { body: mockBody };

		vi.mocked(assertVersionCompatibility).mockResolvedValue();
		vi.mocked(constructUrl).mockReturnValue(new URL('http://example.com/download/test'));
		vi.mocked(ky.get).mockResolvedValue(mockResponse as any);

		const result = await download(versionId, requireSandbox, options);

		expect(assertVersionCompatibility).toHaveBeenCalledWith(options);
		expect(constructUrl).toHaveBeenCalledWith(versionId, requireSandbox, options);
		expect(ky.get).toHaveBeenCalledWith(expect.any(URL));
		expect(result).toBe(mockBody);
	});

	test('Returns ReadableStream type from response.body', async () => {
		const mockBody = new ReadableStream();
		const mockResponse = { body: mockBody };

		vi.mocked(assertVersionCompatibility).mockResolvedValue();
		vi.mocked(constructUrl).mockReturnValue(new URL('http://example.com/download/test'));
		vi.mocked(ky.get).mockResolvedValue(mockResponse as any);

		const result = await download('test-version');

		expect(result).toBeInstanceOf(ReadableStream);
		expect(result).toBe(mockBody);
	});

	test('Handles empty version ID', async () => {
		const mockResponse = { body: new ReadableStream() };

		vi.mocked(assertVersionCompatibility).mockResolvedValue();
		vi.mocked(constructUrl).mockReturnValue(new URL('http://example.com/download/'));
		vi.mocked(ky.get).mockResolvedValue(mockResponse as any);

		const result = await download('');

		expect(constructUrl).toHaveBeenCalledWith('', false, undefined);
		expect(result).toBe(mockResponse.body);
	});

	test('Maintains function execution order', async () => {
		const executionOrder: string[] = [];
		const mockResponse = { body: new ReadableStream() };

		vi.mocked(assertVersionCompatibility).mockImplementation(async () => {
			executionOrder.push('assertVersionCompatibility');
		});

		vi.mocked(constructUrl).mockImplementation(() => {
			executionOrder.push('constructUrl');
			return new URL('http://example.com/download/test');
		});

		vi.mocked(ky.get).mockImplementation((() => {
			executionOrder.push('ky.get');
			return Promise.resolve(mockResponse as any);
		}) as any);

		await download('test-version');

		expect(executionOrder).toEqual(['assertVersionCompatibility', 'constructUrl', 'ky.get']);
	});
});
