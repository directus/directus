import { describe, expect, test } from 'vitest';
import { NOTICE_TYPE, TYPE_MAP, UNTYPED_PACKAGES } from '../constants';
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

test('should generate basic release notes', () => {
	const notices: Notice[] = [];

	const types: Type[] = [
		{
			title: TYPE_MAP.minor,
			packages: [
				{
					name: '@directus/api',
					changes: [change1],
				},
			],
		},
		{
			title: TYPE_MAP.patch,
			packages: [
				{
					name: '@directus/app',
					changes: [change1, change2],
				},
			],
		},
	];

	const untypedPackages: UntypedPackage[] = [
		{ name: UNTYPED_PACKAGES.docs, changes: [change1, change2] },
		{ name: UNTYPED_PACKAGES['tests-blackbox'], changes: [change1] },
	];

	const packageVersions: PackageVersion[] = [
		{ name: '@directus/api', version: '10.0.0' },
		{ name: '@directus/app', version: '10.0.0' },
	];

	const markdown = generateMarkdown(notices, types, untypedPackages, packageVersions);

	expect(markdown).toMatchInlineSnapshot(`
		"### ✨ New Features & Improvements

		- **@directus/api**
		  - Made Directus even more magical ([#1](https://github.com/directus/directus/pull/1) by @@directus)

		### 🐛 Bug Fixes & Optimizations

		- **@directus/app**
		  - Made Directus even more magical ([#1](https://github.com/directus/directus/pull/1) by @@directus)
		  - Improved some things a little ([#2](https://github.com/directus/directus/pull/2) by @@directus)

		### 📝 Documentation

		- Made Directus even more magical ([#1](https://github.com/directus/directus/pull/1) by @@directus)
		- Improved some things a little ([#2](https://github.com/directus/directus/pull/2) by @@directus)

		### 🧪 Blackbox Tests

		- Made Directus even more magical ([#1](https://github.com/directus/directus/pull/1) by @@directus)

		### 📦 Published Versions

		- \`@directus/api@10.0.0\`
		- \`@directus/app@10.0.0\`"
	`);
});

describe('notices', () => {
	const notices: Notice[] = [
		{ notice: 'This is an example notice.', change: change1 },
		{ notice: 'This is another notice.', change: change2 },
	];

	test('should create section with notices when no changes', () => {
		const markdown = generateMarkdown(notices, [], [], []);

		expect(markdown).toMatchInlineSnapshot(`
			"### ⚠️ Potential Breaking Changes

			**Made Directus even more magical ([#1](https://github.com/directus/directus/pull/1))**
			This is an example notice.

			**Improved some things a little ([#2](https://github.com/directus/directus/pull/2))**
			This is another notice."
		`);
	});

	test('should show notices along with changes', () => {
		const types: Type[] = [
			{
				title: NOTICE_TYPE,
				packages: [
					{
						name: '@directus/api',
						changes: [change1],
					},
				],
			},
		];

		const markdown = generateMarkdown(notices, types, [], []);

		expect(markdown).toMatchInlineSnapshot(`
			"### ⚠️ Potential Breaking Changes

			**Made Directus even more magical ([#1](https://github.com/directus/directus/pull/1))**
			This is an example notice.

			**Improved some things a little ([#2](https://github.com/directus/directus/pull/2))**
			This is another notice.

			- **@directus/api**
			  - Made Directus even more magical ([#1](https://github.com/directus/directus/pull/1) by @@directus)"
		`);
	});
});
