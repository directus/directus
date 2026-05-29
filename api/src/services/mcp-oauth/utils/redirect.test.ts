import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OAuthError } from '../types/error.js';
import { matchRedirectUri, validateRedirectUri } from './redirect.js';

const DEFAULT_ALLOWED_CUSTOM_REDIRECTS = ['raycast://oauth', 'cursor://cursor.mcp', 'cursor://anysphere.cursor-mcp'];

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({}),
}));

describe('matchRedirectUri', () => {
	it('exact string match', () => {
		expect(matchRedirectUri('https://example.com/cb', ['https://example.com/cb'])).toBe(true);
	});

	it('non-match', () => {
		expect(matchRedirectUri('https://example.com/cb', ['https://other.com/cb'])).toBe(false);
	});

	it('empty registered list', () => {
		expect(matchRedirectUri('https://example.com/cb', [])).toBe(false);
	});

	describe('RFC 8252 Section 7.3 -- loopback port flexibility', () => {
		it.each([
			{ host: 'localhost', registered: 'http://localhost/callback', requested: 'http://localhost:54771/callback' },
			{ host: '127.0.0.1', registered: 'http://127.0.0.1/callback', requested: 'http://127.0.0.1:8080/callback' },
			{ host: '[::1]', registered: 'http://[::1]/callback', requested: 'http://[::1]:9999/callback' },
		])('$host registered without port matches request with arbitrary port', ({ registered, requested }) => {
			expect(matchRedirectUri(requested, [registered])).toBe(true);
		});

		it('does NOT apply port flexibility to non-loopback hosts', () => {
			expect(matchRedirectUri('https://example.com:8443/cb', ['https://example.com/cb'])).toBe(false);
		});

		it('still requires matching path on loopback', () => {
			expect(matchRedirectUri('http://localhost:3000/other', ['http://localhost/callback'])).toBe(false);
		});

		it('still requires matching query string on loopback', () => {
			expect(matchRedirectUri('http://localhost:3000/callback?code=two', ['http://localhost/callback?code=one'])).toBe(
				false,
			);
		});

		it('allows loopback port flexibility when the query string matches', () => {
			expect(matchRedirectUri('http://localhost:3000/callback?code=one', ['http://localhost/callback?code=one'])).toBe(
				true,
			);
		});

		it('does not allow adding a query string on loopback', () => {
			expect(matchRedirectUri('http://localhost:3000/callback?code=one', ['http://localhost/callback'])).toBe(false);
		});

		it.each(['http://user@localhost:3000/callback', 'http://localhost:3000/callback#fragment'])(
			'rejects requested loopback URI decorations: %s',
			(requested) => {
				expect(matchRedirectUri(requested, [requested])).toBe(false);
				expect(matchRedirectUri(requested, ['http://localhost/callback'])).toBe(false);
			},
		);

		it('still requires matching protocol on loopback', () => {
			expect(matchRedirectUri('https://localhost:3000/cb', ['http://localhost/cb'])).toBe(false);
		});
	});

	it('returns false for invalid URLs without throwing', () => {
		expect(matchRedirectUri('not-a-url', ['https://example.com/cb'])).toBe(false);
	});
});

describe('validateRedirectUri', () => {
	beforeEach(async () => {
		const { useEnv } = vi.mocked(await import('@directus/env'));
		useEnv.mockReturnValue({ MCP_OAUTH_ALLOWED_CUSTOM_REDIRECTS: DEFAULT_ALLOWED_CUSTOM_REDIRECTS } as any);
	});

	it('accepts a valid HTTPS URL', () => {
		expect(() => validateRedirectUri('https://example.com/callback')).not.toThrow();
	});

	it.each(['http://localhost/callback', 'http://127.0.0.1:3000/callback', 'http://[::1]:8080/callback'])(
		'accepts loopback HTTP %s',
		(uri) => {
			expect(() => validateRedirectUri(uri)).not.toThrow();
		},
	);

	it('rejects non-HTTPS non-loopback URI', () => {
		expect(() => validateRedirectUri('http://example.com/callback')).toThrow(OAuthError);
	});

	it.each([
		'raycast://oauth?package_name=directus',
		'raycast://oauth/callback?package_name=directus',
		'cursor://cursor.mcp?name=directus',
		'cursor://cursor.mcp/callback?name=directus',
		'cursor://anysphere.cursor-mcp/callback',
	])('accepts known MCP desktop redirect URI %s', (uri) => {
		expect(() => validateRedirectUri(uri)).not.toThrow();
	});

	it.each([
		'raycast://callback?package_name=directus',
		'raycast://evil.example/callback',
		'cursor://oauth?name=directus',
		'cursor://evil.example/callback',
		'vscode://cursor.mcp/callback',
	])('rejects unknown custom redirect URI %s', (uri) => {
		expect(() => validateRedirectUri(uri)).toThrow(OAuthError);
	});

	it('rejects non-string input', () => {
		expect(() => validateRedirectUri(42)).toThrow(OAuthError);
		expect(() => validateRedirectUri(null)).toThrow(OAuthError);
		expect(() => validateRedirectUri(undefined)).toThrow(OAuthError);
	});

	it('rejects URI longer than 255 chars', () => {
		expect(() => validateRedirectUri(`https://example.com/${'a'.repeat(250)}`)).toThrow(OAuthError);
	});

	it('rejects unparseable URI', () => {
		expect(() => validateRedirectUri('not a url')).toThrow(OAuthError);
	});

	it('rejects URI with fragment', () => {
		expect(() => validateRedirectUri('https://example.com/cb#section')).toThrow(OAuthError);
	});

	it('rejects URI with userinfo', () => {
		expect(() => validateRedirectUri('https://user:pass@example.com/cb')).toThrow(OAuthError);
	});

	describe('MCP_OAUTH_ALLOWED_CUSTOM_REDIRECTS', () => {
		it('uses configured custom redirect authorities instead of the defaults', async () => {
			const { useEnv } = vi.mocked(await import('@directus/env'));
			useEnv.mockReturnValue({ MCP_OAUTH_ALLOWED_CUSTOM_REDIRECTS: ['myapp://oauth'] } as any);

			expect(() => validateRedirectUri('myapp://oauth/callback?package_name=directus')).not.toThrow();
			expect(() => validateRedirectUri('raycast://oauth?package_name=directus')).toThrow(OAuthError);
		});

		it('rejects configured custom redirect requests with a port', async () => {
			const { useEnv } = vi.mocked(await import('@directus/env'));
			useEnv.mockReturnValue({ MCP_OAUTH_ALLOWED_CUSTOM_REDIRECTS: ['myapp://oauth'] } as any);

			expect(() => validateRedirectUri('myapp://oauth:1234/callback')).toThrow(OAuthError);
		});

		it('can disable custom redirect schemes', async () => {
			const { useEnv } = vi.mocked(await import('@directus/env'));
			useEnv.mockReturnValue({ MCP_OAUTH_ALLOWED_CUSTOM_REDIRECTS: [] } as any);

			expect(() => validateRedirectUri('raycast://oauth?package_name=directus')).toThrow(OAuthError);
			expect(() => validateRedirectUri('cursor://cursor.mcp?name=directus')).toThrow(OAuthError);
			expect(() => validateRedirectUri('cursor://anysphere.cursor-mcp/callback')).toThrow(OAuthError);
		});
	});

	describe('MCP_OAUTH_ALLOWED_REDIRECT_DOMAINS', () => {
		beforeEach(async () => {
			const { useEnv } = vi.mocked(await import('@directus/env'));

			useEnv.mockReturnValue({
				MCP_OAUTH_ALLOWED_CUSTOM_REDIRECTS: DEFAULT_ALLOWED_CUSTOM_REDIRECTS,
				MCP_OAUTH_ALLOWED_REDIRECT_DOMAINS: ['cursor.com', '*.anthropic.com'],
			} as any);
		});

		it('accepts redirect on allowed exact domain', () => {
			expect(() => validateRedirectUri('https://cursor.com/cb')).not.toThrow();
		});

		it('accepts redirect on wildcard subdomain', () => {
			expect(() => validateRedirectUri('https://tools.anthropic.com/cb')).not.toThrow();
		});

		it('rejects redirect on disallowed domain', () => {
			expect(() => validateRedirectUri('https://evil.com/cb')).toThrow(OAuthError);
		});

		it('still allows loopback redirects when allowlist is set', () => {
			expect(() => validateRedirectUri('http://localhost:3000/cb')).not.toThrow();
		});

		it('still allows known MCP desktop redirects when allowlist is set', () => {
			expect(() => validateRedirectUri('raycast://oauth?package_name=directus')).not.toThrow();
			expect(() => validateRedirectUri('cursor://cursor.mcp?name=directus')).not.toThrow();
			expect(() => validateRedirectUri('cursor://anysphere.cursor-mcp/callback')).not.toThrow();
		});
	});
});
