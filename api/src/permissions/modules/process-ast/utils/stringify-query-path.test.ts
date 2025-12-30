import { stringifyQueryPath } from './stringify-query-path.js';
import { expect, test } from 'vitest';

test('Joins given path with `.`', () => {
	expect(stringifyQueryPath(['test', 'path'])).toBe('test.path');
});
