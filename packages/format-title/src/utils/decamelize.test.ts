import { decamelize } from './decamelize.js';
import { expect, test } from 'vitest';

test('Converts camelcase to underscores', () => {
	expect(decamelize('camelCase')).toBe('camel_case');
});
