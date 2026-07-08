import { describe, expect, it } from 'vitest';
import { validateProvider } from './validate-provider.js';

describe('validateProvider', () => {
	it.each(['vercel', 'netlify', 'cloudflare-workers'])('should return true for supported provider "%s"', (provider) => {
		expect(validateProvider(provider)).toBe(true);
	});

	it('should return false for an unsupported provider', () => {
		expect(validateProvider('unsupported')).toBe(false);
	});

	it('should return false for an empty string', () => {
		expect(validateProvider('')).toBe(false);
	});
});
