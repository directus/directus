import { afterEach, describe, expect, it } from 'vitest';
import { clearSecrets, redact, registerSecret } from './secret.js';

afterEach(() => {
	clearSecrets();
});

describe('redact', () => {
	it('replaces a registered secret everywhere it appears', () => {
		registerSecret('super-secret-token-value');

		expect(redact('using super-secret-token-value to auth super-secret-token-value')).toBe('using *** to auth ***');
	});

	it('leaves output untouched when nothing is registered', () => {
		expect(redact('plain output, no secrets')).toBe('plain output, no secrets');
	});

	it('ignores short values so ordinary words are not mangled', () => {
		registerSecret('abc'); // below the min length

		expect(redact('abc def abc')).toBe('abc def abc');
	});

	it('scrubs a bearer header even for an unregistered token (backstop)', () => {
		expect(redact('Authorization: Bearer eyJhbGci.some.jwt-like-value')).toBe('Authorization: Bearer ***');
	});

	it('scrubs an access_token query param even if unregistered (backstop)', () => {
		expect(redact('GET https://cms.example.com/assets/x?access_token=abc123def456&width=100')).toBe(
			'GET https://cms.example.com/assets/x?access_token=***&width=100',
		);
	});

	it('clearSecrets empties the registry', () => {
		registerSecret('another-secret-token');
		clearSecrets();

		expect(redact('another-secret-token')).toBe('another-secret-token');
	});
});
