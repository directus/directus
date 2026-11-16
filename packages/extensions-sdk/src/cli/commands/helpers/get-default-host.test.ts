import { expect, test } from 'vitest';
import { LAST_BREAKING_RELEASE } from '../../../constants/last-breaking.js';
import getDefaultHost from './get-default-host.js';

test('uses the first release with richtext support for a richtext extension', () => {
	expect(getDefaultHost('richtext')).toBe('^12.6.0');
});

test('uses the last breaking release for other extension types', () => {
	expect(getDefaultHost('interface')).toBe(`^${LAST_BREAKING_RELEASE}`);
	expect(getDefaultHost('bundle')).toBe(`^${LAST_BREAKING_RELEASE}`);
});
