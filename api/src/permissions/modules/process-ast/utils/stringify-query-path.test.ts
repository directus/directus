import { expect, test } from 'vitest';
import { stringifyQueryPath } from './stringify-query-path.js';

test('Joins given path with `.`', () => {
	expect(stringifyQueryPath(['test', 'path'])).toBe('test.path');
});
