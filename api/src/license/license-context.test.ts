import { describe, expect, test } from 'vitest';
import { hashLicenseKey, normalizeLicenseKey } from './license-context.js';

describe('license key normalization', () => {
	test('canonicalized equivalent DIR key variants identically for matching and hashing', () => {
		const variantA = ' dir-abcdo-1234i-fghij-6789l-klmno ';
		const variantB = 'DIR-ABCD0-12341-FGH1J-67891-K1MN0';
		const normalized = 'DIR-ABCD0-12341-FGH1J-67891-K1MN0';

		expect(normalizeLicenseKey(variantA)).toBe(normalized);
		expect(normalizeLicenseKey(variantB)).toBe(normalized);
		expect(hashLicenseKey(variantA)).toBe(hashLicenseKey(variantB));
	});

	test('normalized malformed keys deterministically without forcing DIR formatting', () => {
		expect(normalizeLicenseKey(' abc - o i l ')).toBe('ABC011');
		expect(hashLicenseKey('abc-oil')).toBe(hashLicenseKey(' ABC011 '));
	});
});
