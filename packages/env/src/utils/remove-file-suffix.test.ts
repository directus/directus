import { expect, test } from 'vitest';
import { removeFileSuffix } from './remove-file-suffix.js';

test('Removes the last 5 characters from the given string', () => {
	expect(removeFileSuffix('TEST_123_FILE')).toBe('TEST_123');
});
