import { expect, test } from 'vitest';
import type { Change, Notice, PackageVersion, Type, UntypedPackage } from '../types';
import { generateMarkdown } from './generate-markdown';

const change1: Change = {
	summary: 'Made Directus even more magical',
	commit: 'abcd123',
	githubInfo: {
		user: '@directus',
		pull: 1,
		links: {
			commit: '[`abcd123`](https://github.com/directus/directus/commit/abcd123)',
			pull: '[#1](https://github.com/directus/directus/pull/1)',
			user: '[@directus](https://github.com/directus)',
		},
	},
};

const change2: Change = {
	summary: 'Improved some things a little',
	commit: 'efgh456',
	githubInfo: {
		user: '@directus',
		pull: 1,
		links: {
			commit: '[`efgh456`](https://github.com/directus/directus/commit/efgh456)',
			pull: '[#2](https://github.com/directus/directus/pull/2)',
			user: '[@directus](https://github.com/directus)',
		},
	},
};

const types: Type[] = [
	{
		title: '✨ New Features & Improvements',
		packages: [
			{
				name: '@directus/api',
				changes: [change1],
			},
		],
	},
	{
		title: '🐛 Bug Fixes & Optimizations',
		packages: [
			{
				name: '@directus/app',
				changes: [change2],
			},
		],
	},
];

const untypedPackages: UntypedPackage[] = [{ name: '📝 Documentation', changes: [change2] }];

const packageVersions: PackageVersion[] = [
	{ name: '@directus/api', version: '10.0.0' },
	{ name: '@directus/app', version: '10.0.0' },
];

test('should generate basic release notes', () => {
	const notices: Notice[] = [];

	const markdown = generateMarkdown(notices, types, untypedPackages, packageVersions);

	expect(markdown).toMatchInlineSnapshot(`
		"### ✨ New Features & Improvements

		- **@directus/api**
		  - Made Directus even more magical ([#1](https://github.com/directus/directus/pull/1) by @@directus)

		### 🐛 Bug Fixes & Optimizations

		- **@directus/app**
		  - Improved some things a little ([#2](https://github.com/directus/directus/pull/2) by @@directus)

		### 📝 Documentation

		- Improved some things a little ([#2](https://github.com/directus/directus/pull/2) by @@directus)

		### 📦 Published Versions

		- \`@directus/api@10.0.0\`
		- \`@directus/app@10.0.0\`"
	`);
});

test('should generate release notes with notice', () => {
	const notices: Notice[] = [{ notice: 'This is an example notice.', change: change1 }];

	const markdown = generateMarkdown(notices, types, untypedPackages, packageVersions);

	expect(markdown).toMatchInlineSnapshot(`
		"### ⚠️ Potential Breaking Changes

		**Made Directus even more magical ([#1](https://github.com/directus/directus/pull/1))**
		This is an example notice.

		### ✨ New Features & Improvements

		- **@directus/api**
		  - Made Directus even more magical ([#1](https://github.com/directus/directus/pull/1) by @@directus)

		### 🐛 Bug Fixes & Optimizations

		- **@directus/app**
		  - Improved some things a little ([#2](https://github.com/directus/directus/pull/2) by @@directus)

		### 📝 Documentation

		- Improved some things a little ([#2](https://github.com/directus/directus/pull/2) by @@directus)

		### 📦 Published Versions

		- \`@directus/api@10.0.0\`
		- \`@directus/app@10.0.0\`"
	`);
});
