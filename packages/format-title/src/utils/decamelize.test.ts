import { expect, test } from 'vite-plus/test';
import { decamelize } from './decamelize.js';

test('Converts camelcase to underscores', () => {
	expect(decamelize('camelCase')).toBe('camel_case');
});
