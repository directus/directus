import { isDirectusVariable } from './is-directus-variable.js';
import { expect, test, vi } from 'vitest';

vi.mock('../constants/directus-variables.js', () => ({
	DIRECTUS_VARIABLES_REGEX: [/TEST_.*/],
}));

test('Returns false if variable matches none of the regexes', () => {
	expect(isDirectusVariable('NO')).toBe(false);
});

test('Returns true if variable matches one or more of the regexes', () => {
	expect(isDirectusVariable('TEST_123')).toBe(true);
});

test('Checks against original name if variable is suffixed with _FILE', () => {
	expect(isDirectusVariable('NO_FILE')).toBe(false);
	expect(isDirectusVariable('TEST_123_FILE')).toBe(true);
});
