import { afterEach, describe, expect, test, vi } from 'vitest';
import { createDirectus, customEndpoint, rest, uploadFiles } from '../index.js';

afterEach(() => {
	vi.unstubAllGlobals();
});

function createClient() {
	const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(JSON.stringify({ data: 'success' })));
	const client = createDirectus('https://example.com', { globals: { fetch } }).with(rest());

	return { client, fetch };
}

describe('REST request headers', () => {
	test('omits the content type for FormData', async () => {
		const { client, fetch } = createClient();
		const body = new FormData();

		await client.request(customEndpoint({ path: '/custom', method: 'POST', body }));

		expect(fetch).toHaveBeenCalledWith('https://example.com/custom', { method: 'POST', headers: {}, body });
	});

	test('removes an explicit content type for FormData', async () => {
		const { client, fetch } = createClient();
		const body = new FormData();

		await client.request(
			customEndpoint({ path: '/custom', method: 'POST', body, headers: { 'Content-Type': 'application/json' } }),
		);

		expect(fetch).toHaveBeenCalledWith('https://example.com/custom', { method: 'POST', headers: {}, body });
	});

	test('defaults to application/json for other bodies', async () => {
		const { client, fetch } = createClient();
		const body = JSON.stringify({ name: 'test' });

		await client.request(customEndpoint({ path: '/custom', method: 'POST', body }));

		expect(fetch).toHaveBeenCalledWith('https://example.com/custom', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body,
		});
	});

	test('keeps an explicit content type for other bodies', async () => {
		const { client, fetch } = createClient();
		const body = 'text';

		await client.request(
			customEndpoint({ path: '/custom', method: 'POST', body, headers: { 'Content-Type': 'text/plain' } }),
		);

		expect(fetch).toHaveBeenCalledWith('https://example.com/custom', {
			method: 'POST',
			headers: { 'Content-Type': 'text/plain' },
			body,
		});
	});

	test('does not mutate the passed headers', async () => {
		const { client } = createClient();
		const headers = { 'Content-Type': 'application/json' };

		await client.request(customEndpoint({ path: '/custom', method: 'POST', body: new FormData(), headers }));

		expect(headers).toEqual({ 'Content-Type': 'application/json' });
	});

	test('removes an explicit multipart/form-data header without a global FormData', async () => {
		const body = new FormData();
		vi.stubGlobal('FormData', undefined);
		const { client, fetch } = createClient();

		await client.request(uploadFiles(body));

		expect(fetch).toHaveBeenCalledWith('https://example.com/files', { method: 'POST', headers: {}, body });
	});

	test('defaults to application/json without a global FormData', async () => {
		vi.stubGlobal('FormData', undefined);
		const { client, fetch } = createClient();

		await client.request(customEndpoint({ path: '/custom' }));

		expect(fetch).toHaveBeenCalledWith('https://example.com/custom', {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		});
	});
});
