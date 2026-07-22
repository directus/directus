import { lookup as dnsLookup, type LookupAddress as DnsLookupAddress, promises as dnsPromises } from 'node:dns';
import http from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OAuthError } from '../types/error.js';

vi.mock('node:dns', async (importOriginal) => {
	const actual = await importOriginal<typeof import('node:dns')>();
	const lookup = vi.fn(actual.lookup);

	return {
		...actual,
		default: {
			...actual,
			lookup,
			promises: {
				...actual.promises,
				lookup: vi.fn(actual.promises.lookup),
			},
		},
		lookup,
		promises: {
			...actual.promises,
			lookup: vi.fn(actual.promises.lookup),
		},
	};
});

const { fetchExternalJson } = await import('./external-json.js');

const mockLookup = vi.mocked(dnsLookup);
const mockLookupAsync = vi.mocked(dnsPromises.lookup);
const LOCAL_HTTP_LOOPBACK_OPTIONS = { allowHttp: true, allowLoopbackForLocalDevelopment: true } as const;

async function withServer(
	handler: http.RequestListener,
	run: (server: { url: string; requests: http.IncomingMessage[] }) => Promise<void>,
) {
	const requests: http.IncomingMessage[] = [];

	const server = http.createServer((req, res) => {
		requests.push(req);
		handler(req, res);
	});

	await new Promise<void>((resolve, reject) => {
		server.listen(0, '127.0.0.1', () => resolve());
		server.on('error', reject);
	});

	try {
		const address = server.address();

		if (!address || typeof address === 'string') throw new Error('Test server did not expose a TCP port');

		await run({ url: `http://metadata.directus.test:${address.port}`, requests });
	} finally {
		await new Promise<void>((resolve, reject) => {
			server.close((error) => {
				if (error) reject(error);
				else resolve();
			});
		});
	}
}

function resolveTo(address: string, family: 4 | 6 = 4) {
	const resolved = [{ address, family }] satisfies DnsLookupAddress[];

	mockLookupAsync.mockResolvedValue(resolved as never);

	mockLookup.mockImplementation(((_hostname: string, options: any, callback: any) => {
		if (options?.all === true) {
			callback(null, resolved);
			return;
		}

		callback(null, address, family);
	}) as any);
}

async function expectOAuthError(promise: Promise<unknown>) {
	let error: unknown;

	try {
		await promise;
	} catch (err) {
		error = err;
	}

	expect(error).toBeInstanceOf(OAuthError);
	expect(error).toMatchObject({ status: 400, code: 'invalid_client_metadata' });
}

describe('fetchExternalJson', () => {
	beforeEach(() => {
		resolveTo('127.0.0.1');
	});

	afterEach(() => {
		vi.restoreAllMocks();
		delete process.env['HTTP_PROXY'];
		delete process.env['http_proxy'];
		delete process.env['NO_PROXY'];
		delete process.env['no_proxy'];
	});

	it('returns JSON data and response cache headers for 200 responses', async () => {
		await withServer(
			(_req, res) => {
				res.writeHead(200, {
					'Content-Type': 'application/json',
					ETag: '"v1"',
					'Cache-Control': 'max-age=60',
				});

				res.end(JSON.stringify({ keys: [{ kid: 'one' }] }));
			},
			async ({ url }) => {
				const result = await fetchExternalJson<{ keys: Array<{ kid: string }> }>(
					`${url}/jwks.json`,
					LOCAL_HTTP_LOOPBACK_OPTIONS,
				);

				expect(result).toEqual({
					status: 200,
					data: { keys: [{ kid: 'one' }] },
					etag: '"v1"',
					cacheControl: 'max-age=60',
					expires: undefined,
				});
			},
		);
	});

	it('returns a 304 result when explicitly allowed', async () => {
		await withServer(
			(_req, res) => {
				res.writeHead(304, {
					ETag: '"v1"',
					'Cache-Control': 'max-age=120',
				});

				res.end();
			},
			async ({ url }) => {
				const result = await fetchExternalJson(`${url}/jwks.json`, {
					...LOCAL_HTTP_LOOPBACK_OPTIONS,
					allowNotModified: true,
					headers: { 'If-None-Match': '"v1"' },
				});

				expect(result).toEqual({ status: 304, etag: '"v1"', cacheControl: 'max-age=120', expires: undefined });
			},
		);
	});

	it('rejects redirects', async () => {
		await withServer(
			(_req, res) => {
				res.writeHead(302, { Location: 'https://example.com/other.json' });
				res.end();
			},
			async ({ url }) => {
				await expectOAuthError(fetchExternalJson(`${url}/metadata.json`, LOCAL_HTTP_LOOPBACK_OPTIONS));
			},
		);
	});

	it('does not use HTTP_PROXY from the environment', async () => {
		await withServer(
			(_proxyReq, proxyRes) => {
				proxyRes.writeHead(502, { 'Content-Type': 'application/json' });
				proxyRes.end(JSON.stringify({ proxied: true }));
			},
			async (proxy) => {
				process.env['HTTP_PROXY'] = proxy.url;

				await withServer(
					(_req, res) => {
						res.writeHead(200, { 'Content-Type': 'application/json' });
						res.end(JSON.stringify({ direct: true }));
					},
					async ({ url }) => {
						const result = await fetchExternalJson(`${url}/metadata.json`, LOCAL_HTTP_LOOPBACK_OPTIONS);

						expect(result).toMatchObject({ status: 200, data: { direct: true } });
						expect(proxy.requests).toHaveLength(0);
					},
				);
			},
		);
	});

	it.each([
		['credentials', 'https://user:pass@example.com/jwks.json'],
		['fragment', 'https://example.com/jwks.json#kid'],
		['empty fragment', 'https://example.com/jwks.json#'],
		['HTTP without allowHttp', 'http://example.com/jwks.json'],
	])('rejects URLs with %s', async (_case, url) => {
		await expectOAuthError(fetchExternalJson(url));
		expect(mockLookupAsync).not.toHaveBeenCalled();
	});

	it('blocks loopback by default', async () => {
		await expectOAuthError(fetchExternalJson('https://metadata.directus.test/jwks.json'));
	});

	it('clears the timeout when DNS preflight rejects before agents are created', async () => {
		const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
		mockLookupAsync.mockRejectedValue(new Error('DNS failed') as never);

		await expectOAuthError(fetchExternalJson('https://metadata.directus.test/jwks.json', { timeoutMs: 25 }));

		expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
	});

	it('allows loopback only with allowHttp and the local development loopback option', async () => {
		await withServer(
			(_req, res) => {
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ ok: true }));
			},
			async ({ url }) => {
				await expectOAuthError(fetchExternalJson(`${url}/jwks.json`, { allowHttp: true }));

				const result = await fetchExternalJson(`${url}/jwks.json`, LOCAL_HTTP_LOOPBACK_OPTIONS);

				expect(result).toMatchObject({ status: 200, data: { ok: true } });
			},
		);
	});

	it.each(['10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254', '224.0.0.1', '0.0.0.0'])(
		'blocks private and special-use IPv4 address %s',
		async (address) => {
			resolveTo(address);

			await expectOAuthError(
				fetchExternalJson('https://metadata.directus.test/jwks.json', LOCAL_HTTP_LOOPBACK_OPTIONS),
			);
		},
	);

	it.each(['192.31.196.1', '192.52.193.1', '192.175.48.1'])(
		'blocks globally reachable IPv4 special-purpose address %s',
		async (address) => {
			resolveTo(address);

			await expectOAuthError(fetchExternalJson('https://metadata.directus.test/jwks.json'));
		},
	);

	it.each(['::1', 'fe80::1', 'fc00::1', 'ff02::1', '2001:db8::1', '::ffff:10.1.2.3'])(
		'blocks private and special-use IPv6 address %s',
		async (address) => {
			resolveTo(address, 6);

			await expectOAuthError(
				fetchExternalJson('https://metadata.directus.test/jwks.json', LOCAL_HTTP_LOOPBACK_OPTIONS),
			);
		},
	);

	it.each(['100:0:0:1::1', '2001:20::1', '2001:30::1', '2002::1', '2620:4f:8000::1', '3fff::1', '5f00::1'])(
		'blocks globally reachable IPv6 special-purpose address %s',
		async (address) => {
			resolveTo(address, 6);

			await expectOAuthError(fetchExternalJson('https://metadata.directus.test/jwks.json'));
		},
	);

	it('blocks non-loopback private ranges even when the loopback local option is enabled', async () => {
		resolveTo('192.168.1.50');

		await expectOAuthError(
			fetchExternalJson('http://metadata.directus.test/jwks.json', {
				...LOCAL_HTTP_LOOPBACK_OPTIONS,
			}),
		);
	});

	it('blocks DNS rebinding to a private address at connect time', async () => {
		mockLookupAsync.mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as never);

		mockLookup.mockImplementation(((_hostname: string, options: any, callback: any) => {
			if (options?.all === true) {
				callback(null, [{ address: '10.0.0.2', family: 4 }]);
				return;
			}

			callback(null, '10.0.0.2', 4);
		}) as any);

		await expectOAuthError(
			fetchExternalJson('https://metadata.directus.test/jwks.json', {
				...LOCAL_HTTP_LOOPBACK_OPTIONS,
				timeoutMs: 25,
			}),
		);
	});

	it('rejects oversized responses before parsing JSON', async () => {
		await withServer(
			(_req, res) => {
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ value: 'x'.repeat(100) }));
			},
			async ({ url }) => {
				await expectOAuthError(
					fetchExternalJson(`${url}/metadata.json`, {
						...LOCAL_HTTP_LOOPBACK_OPTIONS,
						maxBytes: 16,
					}),
				);
			},
		);
	});

	it('rejects non-JSON responses', async () => {
		await withServer(
			(_req, res) => {
				res.writeHead(200, { 'Content-Type': 'text/html' });
				res.end('<html></html>');
			},
			async ({ url }) => {
				await expectOAuthError(fetchExternalJson(`${url}/metadata.json`, LOCAL_HTTP_LOOPBACK_OPTIONS));
			},
		);
	});

	it('times out slow responses', async () => {
		await withServer(
			(_req, res) => {
				setTimeout(() => {
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ late: true }));
				}, 100);
			},
			async ({ url }) => {
				await expectOAuthError(
					fetchExternalJson(`${url}/metadata.json`, {
						...LOCAL_HTTP_LOOPBACK_OPTIONS,
						timeoutMs: 25,
					}),
				);
			},
		);
	});

	it('times out slow-drip responses before EOF', async () => {
		await withServer(
			(_req, res) => {
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.write('{"slow":');

				const interval = setInterval(() => {
					res.write(' ');
				}, 20);

				setTimeout(() => {
					clearInterval(interval);
					res.end('true}');
				}, 500);

				res.on('close', () => clearInterval(interval));
			},
			async ({ url }) => {
				await expectOAuthError(
					fetchExternalJson(`${url}/metadata.json`, {
						...LOCAL_HTTP_LOOPBACK_OPTIONS,
						timeoutMs: 50,
						maxBytes: 1024,
					}),
				);
			},
		);
	});
});
