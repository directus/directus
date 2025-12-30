import { getVersionDisplayName } from './get-version-display-name';
import type { ContentVersion } from '@directus/types';
import { describe, expect, it } from 'vitest';

describe('getVersionDisplayName', () => {
	it('should return "Main" when version is null', () => {
		expect(getVersionDisplayName(null)).toBe('Main');
	});

	it('should return the formatted version key when name is null', () => {
		const versionDisplayName = getVersionDisplayName({
			name: null,
			key: 'my-draft-version',
		} as ContentVersion);

		expect(versionDisplayName).toBe('My Draft Version');
	});

	it('should return the version name when name is provided', () => {
		const versionDisplayName = getVersionDisplayName({
			name: 'Draft Version',
			key: 'my-draft-version',
		} as ContentVersion);

		expect(versionDisplayName).toBe('Draft Version');
	});

	it('should throw when given an invalid version type', () => {
		expect(() => getVersionDisplayName('random string' as any)).toThrow();
	});
});
