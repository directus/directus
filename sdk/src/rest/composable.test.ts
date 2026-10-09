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

describe('REST request content type', () => {
	test('lets fetch set the multipart boundary for a custom endpoint with FormData', async () => {
		const { client, fetch } = createClient();
		const body = new FormData();
		body.append('file', new Blob(['contents']), 'test.txt');

		await client.request(customEndpoint({ path: '/custom', method: 'POST', body }));

		const [url, options] = fetch.mock.calls[0]!;
		const request = new Request(url, options);

		expect(options?.body).toBe(body);
		expect(options?.headers).not.toHaveProperty('Content-Type');
		expect(request.headers.get('Content-Type')).toMatch(/^multipart\/form-data; boundary=/);
		expect(await request.text()).toContain('filename="test.txt"');
	});

	test.each([false, true])(
		'lets fetch set the multipart boundary with a different FormData constructor (global FormData unavailable: %s)',
		async (withoutGlobalFormData) => {
			const { client, fetch } = createClient();
			const body = new FormData();
			body.append('file', new Blob(['contents']), 'test.txt');
			class OtherFormData extends FormData {}

			expect(body).not.toBeInstanceOf(OtherFormData);

			vi.stubGlobal('FormData', withoutGlobalFormData ? undefined : OtherFormData);

			await client.request(customEndpoint({ path: '/custom', method: 'POST', body }));

			const [url, options] = fetch.mock.calls[0]!;

			const request = new Request(url, options);

			expect(options?.body).toBe(body);
			expect(options?.headers).not.toHaveProperty('Content-Type');
			expect(request.headers.get('Content-Type')).toMatch(/^multipart\/form-data; boundary=/);
			expect(await request.text()).toContain('filename="test.txt"');
		},
	);

	test('defaults JSON requests to application/json', async () => {
		const { client, fetch } = createClient();
		const body = JSON.stringify({ name: 'test' });

		await client.request(customEndpoint({ path: '/custom', method: 'POST', body }));

		expect(fetch).toHaveBeenCalledWith('https://example.com/custom', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body,
		});
	});

	test('preserves an explicit content type for FormData', async () => {
		const { client, fetch } = createClient();
		const body = new FormData();

		await client.request(
			customEndpoint({
				path: '/custom',
				method: 'POST',
				body,
				headers: { 'Content-Type': 'application/custom' },
			}),
		);

		expect(fetch).toHaveBeenCalledWith('https://example.com/custom', {
			method: 'POST',
			headers: { 'Content-Type': 'application/custom' },
			body,
		});
	});

	test('continues to omit the multipart header for built-in file uploads', async () => {
		const { client, fetch } = createClient();
		const body = new FormData();
		body.append('file', new Blob(['contents']), 'test.txt');

		await client.request(uploadFiles(body));

		expect(fetch).toHaveBeenCalledWith('https://example.com/files', {
			method: 'POST',
			headers: {},
			body,
		});
	});

	test('supports JSON requests when FormData is unavailable', async () => {
		vi.stubGlobal('FormData', undefined);
		const { client, fetch } = createClient();

		await client.request(customEndpoint({ path: '/custom' }));

		expect(fetch).toHaveBeenCalledWith('https://example.com/custom', {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		});
	});
});
