import type { Config } from './types';

const config: Config = {
	repo: 'directus/directus',
	mainPackage: 'directus',
	typedTitles: {
		major: '⚠️ Potential Breaking Changes',
		minor: '✨ New Features & Improvements',
		patch: '🐛 Bug Fixes & Optimizations',
		none: '📎 Misc.',
	},
	untypedPackageTitles: {
		docs: '📝 Documentation',
		'tests-blackbox': '🧪 Blackbox Tests',
	},
	versionTitle: '📦 Published Versions',
	noticeType: 'major',
	// '@directus/app' should always be listed before '@directus/api', other packages don't matter
	packageOrder: ['@directus/app', '@directus/api'],
	linkedPackages: [
		// Ensure '@directus/app' is bumped with 'directus' to reflect correct main version in app
		['directus', '@directus/app'],
	],
};

export default config;
