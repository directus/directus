import { expect, test } from 'vitest';
import { LAST_BREAKING_RELEASE } from '../../../constants/last-breaking.js';
import getBundleHost from './get-bundle-host.js';

test('raises the host to the first release with richtext support when a richtext entry is present', () => {
	expect(getBundleHost(`^${LAST_BREAKING_RELEASE}`, ['interface', 'richtext'])).toBe('^12.6.0');
});

test('keeps the host when no entry needs a newer release', () => {
	expect(getBundleHost(`^${LAST_BREAKING_RELEASE}`, ['interface', 'endpoint'])).toBe(`^${LAST_BREAKING_RELEASE}`);
});

test('keeps a host that is already newer than every entry needs', () => {
	expect(getBundleHost('^13.0.0', ['richtext'])).toBe('^13.0.0');
	expect(getBundleHost('>=12.7.0', ['richtext'])).toBe('>=12.7.0');
});

test('keeps a host that is not a valid range', () => {
	expect(getBundleHost('not-a-range', ['richtext'])).toBe('not-a-range');
});
