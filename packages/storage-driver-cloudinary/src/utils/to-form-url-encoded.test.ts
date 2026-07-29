import { expect, test } from 'vitest';
import { toFormUrlEncoded } from './to-form-url-encoded.js';

test('Returns an empty string for an empty object', () => {
	expect(toFormUrlEncoded({})).toBe('');
});

test('Serializes entries as key=value pairs joined by ampersands, in insertion order', () => {
	expect(
		toFormUrlEncoded({
			second: 'two',
			first: 'one',
			third: 'three',
		}),
	).toBe('second=two&first=one&third=three');
});

test('Sorts entries alphabetically by key when the sort option is enabled', () => {
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

test('Keeps slashes in values unescaped so folder paths survive', () => {
	expect(toFormUrlEncoded({ public_id: 'folder/sub/file' })).toBe('public_id=folder/sub/file');
});
