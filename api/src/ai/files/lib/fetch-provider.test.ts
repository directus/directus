import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchProvider } from './fetch-provider.js';

describe('fetchProvider', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns parsed JSON for successful responses', async () => {
		const fetchSpy = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(new Response(JSON.stringify({ id: 'file-123' }), { status: 200 }));

		const result = await fetchProvider('https://example.com/upload', { method: 'POST' }, 'OpenAI');

		expect(result).toEqual({ id: 'file-123' });
		expect(fetchSpy).toHaveBeenCalled();
	});

	it('throws a provider-specific error for non-ok responses', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('bad request', { status: 400 }));

		await expect(fetchProvider('https://example.com/upload', { method: 'POST' }, 'OpenAI')).rejects.toThrow(
			'OpenAI upload failed: bad request',
		);
	});

	it('throws a timeout error when provider upload times out', async () => {
		const timeoutError = new Error('Timed out');
		timeoutError.name = 'TimeoutError';

		vi.spyOn(globalThis, 'fetch').mockRejectedValue(timeoutError);

		await expect(fetchProvider('https://example.com/upload', { method: 'POST' }, 'OpenAI')).rejects.toThrow(
			'OpenAI upload timed out after 120s',
		);
	});

	it('throws invalid response error and keeps the original cause', async () => {
		const invalidJsonCause = new SyntaxError('Unexpected token');

		vi.spyOn(globalThis, 'fetch').mockResolvedValue({
			ok: true,
			json: vi.fn().mockRejectedValue(invalidJsonCause),
		} as unknown as Response);

		const error = (await fetchProvider('https://example.com/upload', { method: 'POST' }, 'OpenAI').catch(
			(error) => error as Error & { cause?: unknown },
		)) as Error & { cause?: unknown };

		expect(error).toBeInstanceOf(Error);
		expect(error.message).toBe('OpenAI upload succeeded but returned invalid response');
		expect(error.cause).toBe(invalidJsonCause);
	});
});
