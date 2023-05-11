import { VersionType } from '@changesets/types';

export const REPO = 'directus/directus';

export const TYPE_MAP: Record<VersionType, string> = {
	major: '⚠️ Potential Breaking Changes',
	minor: '✨ New Features & Improvements',
	patch: '🐛 Bug Fixes & Optimizations',
	none: '📎 Misc.',
};

export const FILTERED_PACKAGES = ['directus'];

export const UNTYPED_PACKAGES: Record<string, string> = {
	docs: '📝 Documentation',
	'tests-blackbox': '🧪 Blackbox Tests',
};

export const PACKAGE_ORDER = ['@directus/app', '@directus/api'];

export const VERSIONS_TITLE = '📦 Published Versions';
