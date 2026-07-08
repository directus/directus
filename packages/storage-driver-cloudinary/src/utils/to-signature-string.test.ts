import { expect, test } from 'vitest';
import { toSignatureString } from './to-signature-string.js';

test('Returns an empty string for an empty object', () => {
	expect(toSignatureString({})).toBe('');
});

test('Sorts entries alphabetically by key', () => {
	expect(
		toSignatureString({
			b_key: 'second',
			c_key: 'third',
			a_key: 'first',
		}),
	).toBe('a_key=first&b_key=second&c_key=third');
});

test('Preserves spaces in values instead of encoding them as plus signs', () => {
	expect(toSignatureString({ asset_folder: 'my folder' })).toBe('asset_folder=my folder');
});

test('Emits values verbatim without any URL-encoding', () => {
	expect(toSignatureString({ path: 'a b/c+d' })).toBe('path=a b/c+d');
});
