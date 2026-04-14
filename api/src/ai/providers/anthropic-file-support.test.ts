import { createAnthropic } from '@ai-sdk/anthropic';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAnthropicWithFileSupport } from './anthropic-file-support.js';

vi.mock('@ai-sdk/anthropic', () => ({
	createAnthropic: vi.fn(({ fetch: customFetch }) => {
		// Store the custom fetch so tests can invoke it directly
		(createAnthropic as any).__customFetch = customFetch;
		return { type: 'anthropic-provider' };
	}),
}));

function getCustomFetch(): (url: string, options?: RequestInit) => Promise<Response> {
	return (createAnthropic as any).__customFetch;
}

describe('createAnthropicWithFileSupport', () => {
	let mockFetch: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		mockFetch = vi.fn().mockResolvedValue(new Response('ok'));
		vi.stubGlobal('fetch', mockFetch);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.clearAllMocks();
	});

	it('should pass through when body is not a string', async () => {
		createAnthropicWithFileSupport('test-key');
		const customFetch = getCustomFetch();

		await customFetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			body: undefined,
		} as any);

		expect(mockFetch).toHaveBeenCalledWith(
			'https://api.anthropic.com/v1/messages',
			expect.objectContaining({
				body: undefined,
			}),
		);
	});

	it('should throw when body is not valid JSON', async () => {
		createAnthropicWithFileSupport('test-key');
		const customFetch = getCustomFetch();

		await expect(
			customFetch('https://api.anthropic.com/v1/messages', {
				method: 'POST',
				body: 'not json',
				headers: new Headers(),
			}),
		).rejects.toThrow();
	});

	it('should pass through when body has no messages', async () => {
		createAnthropicWithFileSupport('test-key');
		const customFetch = getCustomFetch();

		await customFetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			body: JSON.stringify({ model: 'claude-3' }),
			headers: new Headers(),
		});

		expect(mockFetch).toHaveBeenCalledWith(
			'https://api.anthropic.com/v1/messages',
			expect.objectContaining({
				body: JSON.stringify({ model: 'claude-3' }),
			}),
		);
	});

	it('should transform base64 source with file_ prefix to file source', async () => {
		createAnthropicWithFileSupport('test-key');
		const customFetch = getCustomFetch();

		const body = {
			model: 'claude-3',
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'image',
							source: {
								type: 'base64',
								media_type: 'image/png',
								data: 'file_abc123',
							},
						},
					],
				},
			],
		};

		await customFetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			body: JSON.stringify(body),
			headers: new Headers(),
		});

		const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);

		expect(sentBody.messages[0].content[0]).toEqual({
			type: 'image',
			source: {
				type: 'file',
				file_id: 'file_abc123',
			},
		});
	});

	it('should leave non-file base64 blocks unchanged', async () => {
		createAnthropicWithFileSupport('test-key');
		const customFetch = getCustomFetch();

		const body = {
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'image',
							source: {
								type: 'base64',
								media_type: 'image/png',
								data: 'iVBORw0KGgoAAAANS',
							},
						},
					],
				},
			],
		};

		await customFetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			body: JSON.stringify(body),
			headers: new Headers(),
		});

		const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);

		expect(sentBody.messages[0].content[0].source.type).toBe('base64');
		expect(sentBody.messages[0].content[0].source.data).toBe('iVBORw0KGgoAAAANS');
	});

	it('should leave text blocks unchanged', async () => {
		createAnthropicWithFileSupport('test-key');
		const customFetch = getCustomFetch();

		const body = {
			messages: [
				{
					role: 'user',
					content: [{ type: 'text', text: 'describe this image' }],
				},
			],
		};

		await customFetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			body: JSON.stringify(body),
			headers: new Headers(),
		});

		const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);

		expect(sentBody.messages[0].content[0]).toEqual({ type: 'text', text: 'describe this image' });
	});

	it('should add files-api beta header when file IDs are present', async () => {
		createAnthropicWithFileSupport('test-key');
		const customFetch = getCustomFetch();

		const body = {
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'document',
							source: { type: 'base64', media_type: 'application/pdf', data: 'file_doc456' },
						},
					],
				},
			],
		};

		await customFetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			body: JSON.stringify(body),
			headers: new Headers(),
		});

		const sentHeaders = mockFetch.mock.calls[0][1].headers;

		expect(sentHeaders['anthropic-beta']).toBe('files-api-2025-04-14');
	});

	it('should append to existing beta headers without duplicating', async () => {
		createAnthropicWithFileSupport('test-key');
		const customFetch = getCustomFetch();

		const body = {
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'image',
							source: { type: 'base64', data: 'file_img789' },
						},
					],
				},
			],
		};

		const headers = new Headers();
		headers.set('anthropic-beta', 'some-other-beta');

		await customFetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			body: JSON.stringify(body),
			headers,
		});

		const sentHeaders = mockFetch.mock.calls[0][1].headers;

		expect(sentHeaders['anthropic-beta']).toBe('some-other-beta,files-api-2025-04-14');
	});

	it('should not add beta header when no file IDs are present', async () => {
		createAnthropicWithFileSupport('test-key');
		const customFetch = getCustomFetch();

		const body = {
			messages: [
				{
					role: 'user',
					content: [{ type: 'text', text: 'hello' }],
				},
			],
		};

		await customFetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			body: JSON.stringify(body),
			headers: new Headers(),
		});

		const sentHeaders = mockFetch.mock.calls[0][1].headers;

		expect(sentHeaders['anthropic-beta']).toBeUndefined();
	});

	it('should throw on transformation errors', async () => {
		createAnthropicWithFileSupport('test-key');
		const customFetch = getCustomFetch();

		// Create body that will parse but cause a TypeError in transformation
		const body = {
			messages: 'not-an-array',
		};

		await expect(
			customFetch('https://api.anthropic.com/v1/messages', {
				method: 'POST',
				body: JSON.stringify(body),
				headers: new Headers(),
			}),
		).rejects.toThrow();
	});
});
