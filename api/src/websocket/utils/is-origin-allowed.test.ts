import type { IncomingMessage } from 'http';
import { useEnv } from '@directus/env';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { isOriginAllowed } from './is-origin-allowed.js';

vi.mock('@directus/env');

type ReqOptions = {
	origin?: string;
	host?: string;
	forwardedHost?: string;
	remoteAddress?: string;
};

function fakeRequest({ origin, host, forwardedHost, remoteAddress = '203.0.113.10' }: ReqOptions): IncomingMessage {
	const headers: Record<string, string> = {};
	if (origin !== undefined) headers['origin'] = origin;
	if (host !== undefined) headers['host'] = host;
	if (forwardedHost !== undefined) headers['x-forwarded-host'] = forwardedHost;

	return {
		headers,
		socket: { remoteAddress },
	} as unknown as IncomingMessage;
}

beforeEach(() => {
	vi.mocked(useEnv).mockReturnValue({
		PUBLIC_URL: '/',
		IP_TRUST_PROXY: false,
		CORS_ENABLED: false,
		CORS_ORIGIN: false,
	});
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('requests without an Origin header', () => {
	test('Allows missing origin (server-to-server)', () => {
		expect(isOriginAllowed(fakeRequest({ host: 'directus.example' }))).toBe(true);
	});

	test('Allows empty origin', () => {
		expect(isOriginAllowed(fakeRequest({ origin: '', host: 'directus.example' }))).toBe(true);
	});
});

describe('malformed Origin header', () => {
	test('Rejects an unparseable origin', () => {
		expect(isOriginAllowed(fakeRequest({ origin: 'not a url', host: 'directus.example' }))).toBe(false);
	});
});

describe('same-origin requests', () => {
	test('Allows when origin host matches the request host', () => {
		expect(isOriginAllowed(fakeRequest({ origin: 'https://directus.example', host: 'directus.example' }))).toBe(true);
	});

	test('Allows when origin host:port matches the request host:port', () => {
		expect(isOriginAllowed(fakeRequest({ origin: 'http://localhost:8055', host: 'localhost:8055' }))).toBe(true);
	});

	test('Ignores scheme so a TLS-terminating proxy still matches', () => {
		expect(isOriginAllowed(fakeRequest({ origin: 'https://directus.example', host: 'directus.example' }))).toBe(true);
	});

	test('Rejects a cross-origin request', () => {
		expect(isOriginAllowed(fakeRequest({ origin: 'https://attacker.example', host: 'directus.example' }))).toBe(false);
	});

	test('Rejects a sibling subdomain', () => {
		expect(isOriginAllowed(fakeRequest({ origin: 'https://attacker.example.com', host: 'directus.example.com' }))).toBe(
			false,
		);
	});

	test('Rejects when host is missing and nothing else allows it', () => {
		expect(isOriginAllowed(fakeRequest({ origin: 'https://attacker.example' }))).toBe(false);
	});
});

describe('X-Forwarded-Host / IP_TRUST_PROXY', () => {
	test('Ignores X-Forwarded-Host when proxy is not trusted', () => {
		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL: '/',
			IP_TRUST_PROXY: false,
			CORS_ENABLED: false,
			CORS_ORIGIN: false,
		});

		// Attacker-supplied forwarded header must not be honored when untrusted
		expect(
			isOriginAllowed(
				fakeRequest({
					origin: 'https://attacker.example',
					host: 'internal:8055',
					forwardedHost: 'attacker.example',
				}),
			),
		).toBe(false);
	});

	test('Honors X-Forwarded-Host when proxy is trusted', () => {
		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL: '/',
			IP_TRUST_PROXY: true,
			CORS_ENABLED: false,
			CORS_ORIGIN: false,
		});

		expect(
			isOriginAllowed(
				fakeRequest({
					origin: 'https://directus.example',
					host: 'internal:8055',
					forwardedHost: 'directus.example',
				}),
			),
		).toBe(true);
	});

	test('Uses the first hop of a comma-separated X-Forwarded-Host', () => {
		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL: '/',
			IP_TRUST_PROXY: true,
			CORS_ENABLED: false,
			CORS_ORIGIN: false,
		});

		expect(
			isOriginAllowed(
				fakeRequest({
					origin: 'https://directus.example',
					host: 'internal:8055',
					forwardedHost: 'directus.example, proxy.internal',
				}),
			),
		).toBe(true);
	});

	test('Trusts X-Forwarded-Host only from a configured proxy subnet', () => {
		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL: '/',
			IP_TRUST_PROXY: '10.0.0.0/8',
			CORS_ENABLED: false,
			CORS_ORIGIN: false,
		});

		// Trusted peer -> honored
		expect(
			isOriginAllowed(
				fakeRequest({
					origin: 'https://directus.example',
					host: 'internal:8055',
					forwardedHost: 'directus.example',
					remoteAddress: '10.1.2.3',
				}),
			),
		).toBe(true);

		// Untrusted peer -> ignored
		expect(
			isOriginAllowed(
				fakeRequest({
					origin: 'https://directus.example',
					host: 'internal:8055',
					forwardedHost: 'directus.example',
					remoteAddress: '203.0.113.10',
				}),
			),
		).toBe(false);
	});
});

describe('PUBLIC_URL matching', () => {
	test('Allows an origin matching the configured PUBLIC_URL', () => {
		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL: 'https://directus.example',
			IP_TRUST_PROXY: false,
			CORS_ENABLED: false,
			CORS_ORIGIN: false,
		});

		// host differs (reverse proxy) but PUBLIC_URL matches
		expect(isOriginAllowed(fakeRequest({ origin: 'https://directus.example', host: 'internal:8055' }))).toBe(true);
	});

	test('Rejects an origin that does not match PUBLIC_URL', () => {
		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL: 'https://directus.example',
			IP_TRUST_PROXY: false,
			CORS_ENABLED: false,
			CORS_ORIGIN: false,
		});

		expect(isOriginAllowed(fakeRequest({ origin: 'https://attacker.example', host: 'internal:8055' }))).toBe(false);
	});

	test('Compares the full origin including port', () => {
		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL: 'https://directus.example:8443',
			IP_TRUST_PROXY: false,
			CORS_ENABLED: false,
			CORS_ORIGIN: false,
		});

		expect(isOriginAllowed(fakeRequest({ origin: 'https://directus.example', host: 'internal' }))).toBe(false);
		expect(isOriginAllowed(fakeRequest({ origin: 'https://directus.example:8443', host: 'internal' }))).toBe(true);
	});

	test('Ignores a relative PUBLIC_URL', () => {
		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL: '/',
			IP_TRUST_PROXY: false,
			CORS_ENABLED: false,
			CORS_ORIGIN: false,
		});

		expect(isOriginAllowed(fakeRequest({ origin: 'https://attacker.example', host: 'internal' }))).toBe(false);
	});
});

describe('CORS_ORIGIN allowlist', () => {
	test('Does not consult CORS_ORIGIN when CORS is disabled', () => {
		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL: '/',
			IP_TRUST_PROXY: false,
			CORS_ENABLED: false,
			CORS_ORIGIN: 'https://app.example',
		});

		expect(isOriginAllowed(fakeRequest({ origin: 'https://app.example', host: 'directus.example' }))).toBe(false);
	});

	test('Allows any origin when CORS_ORIGIN is true', () => {
		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL: '/',
			IP_TRUST_PROXY: false,
			CORS_ENABLED: true,
			CORS_ORIGIN: true,
		});

		expect(isOriginAllowed(fakeRequest({ origin: 'https://attacker.example', host: 'directus.example' }))).toBe(true);
	});

	test('Rejects all origins when CORS_ORIGIN is false', () => {
		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL: '/',
			IP_TRUST_PROXY: false,
			CORS_ENABLED: true,
			CORS_ORIGIN: false,
		});

		expect(isOriginAllowed(fakeRequest({ origin: 'https://app.example', host: 'directus.example' }))).toBe(false);
	});

	test('Does not treat a "*" wildcard as allow-any (cannot carry credentials)', () => {
		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL: '/',
			IP_TRUST_PROXY: false,
			CORS_ENABLED: true,
			CORS_ORIGIN: '*',
		});

		expect(isOriginAllowed(fakeRequest({ origin: 'https://attacker.example', host: 'directus.example' }))).toBe(false);
	});

	test('Does not treat an empty-string CORS_ORIGIN as allow-any', () => {
		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL: '/',
			IP_TRUST_PROXY: false,
			CORS_ENABLED: true,
			CORS_ORIGIN: '',
		});

		expect(isOriginAllowed(fakeRequest({ origin: 'https://attacker.example', host: 'directus.example' }))).toBe(false);
	});

	test('Honors a "true" entry inside an array CORS_ORIGIN (reflect any)', () => {
		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL: '/',
			IP_TRUST_PROXY: false,
			CORS_ENABLED: true,
			CORS_ORIGIN: [true, 'https://app.example'],
		});

		expect(isOriginAllowed(fakeRequest({ origin: 'https://anything.example', host: 'directus.example' }))).toBe(true);
	});

	test('Does not treat a "*" entry inside an array as allow-any', () => {
		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL: '/',
			IP_TRUST_PROXY: false,
			CORS_ENABLED: true,
			CORS_ORIGIN: ['*', 'https://app.example'],
		});

		expect(isOriginAllowed(fakeRequest({ origin: 'https://app.example', host: 'directus.example' }))).toBe(true);
		expect(isOriginAllowed(fakeRequest({ origin: 'https://attacker.example', host: 'directus.example' }))).toBe(false);
	});

	test('Matches a string CORS_ORIGIN exactly', () => {
		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL: '/',
			IP_TRUST_PROXY: false,
			CORS_ENABLED: true,
			CORS_ORIGIN: 'https://app.example',
		});

		expect(isOriginAllowed(fakeRequest({ origin: 'https://app.example', host: 'directus.example' }))).toBe(true);
		expect(isOriginAllowed(fakeRequest({ origin: 'https://other.example', host: 'directus.example' }))).toBe(false);
	});

	test('Matches any entry in an array CORS_ORIGIN', () => {
		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL: '/',
			IP_TRUST_PROXY: false,
			CORS_ENABLED: true,
			CORS_ORIGIN: ['https://app.example', 'https://admin.example'],
		});

		expect(isOriginAllowed(fakeRequest({ origin: 'https://admin.example', host: 'directus.example' }))).toBe(true);
		expect(isOriginAllowed(fakeRequest({ origin: 'https://attacker.example', host: 'directus.example' }))).toBe(false);
	});

	test('Matches a RegExp CORS_ORIGIN', () => {
		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL: '/',
			IP_TRUST_PROXY: false,
			CORS_ENABLED: true,
			CORS_ORIGIN: /\.example$/,
		});

		expect(isOriginAllowed(fakeRequest({ origin: 'https://app.example', host: 'directus.example' }))).toBe(true);
		expect(isOriginAllowed(fakeRequest({ origin: 'https://app.evil', host: 'directus.example' }))).toBe(false);
	});

	test('Matches a RegExp entry inside an array CORS_ORIGIN', () => {
		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL: '/',
			IP_TRUST_PROXY: false,
			CORS_ENABLED: true,
			CORS_ORIGIN: ['https://app.example', /admin\..*\.example$/],
		});

		expect(isOriginAllowed(fakeRequest({ origin: 'https://admin.eu.example', host: 'directus.example' }))).toBe(true);
		expect(isOriginAllowed(fakeRequest({ origin: 'https://attacker.example', host: 'directus.example' }))).toBe(false);
	});
});
