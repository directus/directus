import { expect, test } from 'vite-plus/test';
import { stringifyQueryPath } from './stringify-query-path.js';

test('Joins given path with `.`', () => {
	expect(stringifyQueryPath(['test', 'path'])).toBe('test.path');
});
