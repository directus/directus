import { getCastFlag } from './has-cast-prefix.js';
import { expect, test, vi } from 'vitest';

vi.mock('../constants/env-types.js', () => ({
	ENV_TYPES: ['test'],
}));

test('Returns null if value is not a string', () => {
	expect(getCastFlag(123)).toBe(null);
	expect(getCastFlag({ hello: 'world' })).toBe(null);
	expect(getCastFlag(false)).toBe(null);
});

test('Returns null if string value does not contain a colon', () => {
	expect(getCastFlag('hello')).toBe(null);
});

test('Returns null if cast flag is not a valid env type', () => {
	expect(getCastFlag('hello:world')).toBe(null);
});

test('Returns test flag if exists in env types const', () => {
	expect(getCastFlag('test:foo')).toBe('test');
});
