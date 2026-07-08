import { describe, expect, test } from 'vitest';
import { toFormUrlEncoded, toSignatureString } from './utils.js';

describe('toFormUrlEncoded', () => {
	test('parses a plain object of strings', () => {
		const result = toFormUrlEncoded({
			first: 'one',
			second: 'two',
			third: 'three',
		});

		expect(result).toContain('first=one');
		expect(result).toContain('second=two');
		expect(result).toContain('third=three');
	});

	test('optionally sorts the properties alphabetically', () => {
		expect(
			toFormUrlEncoded(
				{
					b_key: 'second',
					c_key: 'third',
					a_key: 'first',
				},
				{ sort: true },
			),
		).toBe('a_key=first&b_key=second&c_key=third');
	});
});

describe('toSignatureString', () => {
	test('sorts the properties alphabetically', () => {
		expect(
			toSignatureString({
				b_key: 'second',
				c_key: 'third',
				a_key: 'first',
			}),
		).toBe('a_key=first&b_key=second&c_key=third');
	});

	test('preserves spaces in values', () => {
		expect(
			toSignatureString({
				asset_folder: 'my folder',
			}),
		).toBe('asset_folder=my folder');
	});
});
