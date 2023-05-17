import { expect, test, vi } from 'vitest';
import type { Change, PackageVersion, Type, UntypedPackage } from '../types';
import { generateMarkdown } from './generate-markdown';

const mainVersion = '10.0.0';

const change: Change = {
	summary: 'Increased Directus Magic',
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

const types: Type[] = [
	{
		title: '✨ New Features & Improvements',
		packages: [
			{
				name: '@directus/api',
				changes: [change],
			},
		],
	},
];

const untypedPackages: UntypedPackage[] = [{ name: '📝 Documentation', changes: [change] }];
const packageVersions: PackageVersion[] = [{ name: '@directus/api', version: '10.0.0' }];

test('#generateMarkdown', () => {
	const date = new Date(2023, 4, 12);
	vi.setSystemTime(date);

	const markdown = generateMarkdown(mainVersion, types, untypedPackages, packageVersions);

	expect(markdown).toMatchInlineSnapshot(`
		"## v10.0.0 (May 12, 2023)

		### ✨ New Features & Improvements

		- **@directus/api**
		  - Increased Directus Magic ([#1](https://github.com/directus/directus/pull/1) by @@directus)

		### 📝 Documentation

		- Increased Directus Magic ([#1](https://github.com/directus/directus/pull/1) by @@directus)

		### 📦 Published Versions

		- \`@directus/api@10.0.0\`"
	`);
});
