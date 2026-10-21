import { afterEach, describe, expect, test, vi } from 'vitest';
import { createDirectus, customEndpoint, rest } from '../index.js';

afterEach(() => {
	vi.unstubAllGlobals();
});

function createClient() {
	const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(JSON.stringify({ data: 'success' })));
	const client = createDirectus('https://example.com', { globals: { fetch } }).with(rest());

	return { client, fetch };
}

describe('REST request content type', () => {
	test('omits the content type for FormData so fetch can set the multipart boundary', async () => {
		const { client, fetch } = createClient();
		const body = new FormData();

		await client.request(customEndpoint({ path: '/custom', method: 'POST', body }));

		expect(fetch).toHaveBeenCalledWith('https://example.com/custom', { method: 'POST', headers: {}, body });
	});

	test('defaults to application/json', async () => {
		const { client, fetch } = createClient();
		const body = JSON.stringify({ name: 'test' });

		await client.request(customEndpoint({ path: '/custom', method: 'POST', body }));

		expect(fetch).toHaveBeenCalledWith('https://example.com/custom', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body,
		});
	});

	test('defaults to application/json when FormData is unavailable', async () => {
		vi.stubGlobal('FormData', undefined);
		const { client, fetch } = createClient();

		await client.request(customEndpoint({ path: '/custom' }));

		expect(fetch).toHaveBeenCalledWith('https://example.com/custom', {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		});
	});
});
