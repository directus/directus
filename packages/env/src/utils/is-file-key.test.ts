import { isFileKey } from './is-file-key.js';
import { expect, test } from 'vitest';

test('Returns false if key is less than or equal to 5 in length', () => {
	expect(isFileKey('hello')).toBe(false);
	expect(isFileKey('foo')).toBe(false);
});

test('Returns false if key does not end with _FILE', () => {
	expect(isFileKey('TEST_123')).toBe(false);
});

test('Returns true if key is longer than 5 characters and ends in _FILE', () => {
	expect(isFileKey('TEST_123_FILE')).toBe(true);
});
