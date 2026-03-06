import { VERSION_KEY_DRAFT } from '@directus/constants';
import { describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import { getVersionDisplayName } from './get-version-display-name';

vi.mock('@/lang', () => {
	const i18n = createI18n({
		legacy: false,
		locale: 'en-US',
		messages: {
			'en-US': {
				published: 'Published',
				draft: 'Draft',
			},
		},
	});

	return { i18n };
});

describe('getVersionDisplayName', () => {
	it('should return "Published" when version is null', () => {
		expect(getVersionDisplayName(null)).toBe('Published');
	});

	it('should return "Draft" for global draft version', () => {
		const versionDisplayName = getVersionDisplayName({
			name: null,
			key: VERSION_KEY_DRAFT,
		});

		expect(versionDisplayName).toBe('Draft');
	});

	it('should return "Draft" for global draft version even when name is provided', () => {
		const versionDisplayName = getVersionDisplayName({
			name: 'Custom Name',
			key: VERSION_KEY_DRAFT,
		});

		expect(versionDisplayName).toBe('Draft');
	});

	it('should return the formatted version key when name is null', () => {
		const versionDisplayName = getVersionDisplayName({
			name: null,
			key: 'my-draft-version',
		});

		expect(versionDisplayName).toBe('My Draft Version');
	});

	it('should return the version name when name is provided', () => {
		const versionDisplayName = getVersionDisplayName({
			name: 'Draft Version',
			key: 'my-draft-version',
		});

		expect(versionDisplayName).toBe('Draft Version');
	});

	it('should throw when given an invalid version type', () => {
		expect(() => getVersionDisplayName('random string' as any)).toThrow();
	});
});
