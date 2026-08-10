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

	it('redacts short registered secrets', () => {
		registerSecret('abc');

		expect(redact('abc def abc')).toBe('*** def ***');
	});

	it('ignores an empty registered value', () => {
		registerSecret('');

		expect(redact('plain output')).toBe('plain output');
	});

	it('scrubs a bearer header even for an unregistered token (backstop)', () => {
		expect(redact('Authorization: Bearer eyJhbGci.some.jwt-like-value')).toBe('Authorization: Bearer ***');
	});

	it('scrubs an access_token query param even if unregistered (backstop)', () => {
		expect(redact('GET https://cms.example.com/assets/x?access_token=abc123def456&width=100')).toBe(
			'GET https://cms.example.com/assets/x?access_token=***&width=100',
		);
	});
});
