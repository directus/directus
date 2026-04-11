import { describe, expect, it } from 'vitest';
import { matchRedirectUri } from './redirect.js';

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

		it('still requires matching protocol on loopback', () => {
			expect(matchRedirectUri('https://localhost:3000/cb', ['http://localhost/cb'])).toBe(false);
		});
	});

	it('returns false for invalid URLs without throwing', () => {
		expect(matchRedirectUri('not-a-url', ['https://example.com/cb'])).toBe(false);
	});
});
