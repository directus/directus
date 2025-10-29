import { expect, test, vi } from 'vitest';
import { Changesets, Config } from '../types.js';
import { getInfo } from './get-info.js';

vi.mock('../config.js', () => {
	const config: Partial<Config> = {
		mainPackage: 'main',
		typedTitles: {
			major: 'Major',
			minor: 'Minor',
			patch: 'Patch',
			none: 'None',
		},
		untypedPackageTitles: { docs: 'Docs' },
		packageOrder: [],
	};

	return { default: config };
});

vi.mock('@changesets/get-github-info', () => ({
	getInfo: () => ({}),
}));

const changesets: Changesets = new Map([
	[
		'1',
		{
			commit: 'abcd123',
			summary: 'Made Directus even more magical',
			notice: undefined,
			releases: [{ name: 'directus', type: 'patch' }],
			dependencies: [],
		},
	],
	[
		'2',
		{
			commit: 'efgh456',
			summary: 'Improved some things a little',
			notice: 'This is an example notice.',
			releases: [{ name: 'docs', type: 'minor' }],
			dependencies: [],
		},
	],
]);

test('should compose info from changesets', async () => {
	const info = await getInfo(changesets);

	expect(info).toMatchInlineSnapshot(`
		{
		  "dependencies": [],
		  "notices": [
		    {
		      "change": {
		        "commit": "efgh456",
		        "githubInfo": {},
		        "summary": "Improved some things a little",
		      },
		      "notice": "This is an example notice.",
		    },
		  ],
		  "types": [
		    {
		      "packages": [
		        {
		          "changes": [
		            {
		              "commit": "abcd123",
		              "githubInfo": {},
		              "summary": "Made Directus even more magical",
		            },
		          ],
		          "name": "directus",
		        },
		      ],
		      "title": "Patch",
		    },
		  ],
		  "untypedPackages": [
		    {
		      "changes": [
		        {
		          "commit": "efgh456",
		          "githubInfo": {},
		          "summary": "Improved some things a little",
		        },
		      ],
		      "name": "Docs",
		    },
		  ],
		}
	`);
});

test('deduplicate dependency changes', async () => {
	const info = await getInfo(
		new Map([
			[
				'1',
				{
					commit: 'abcd123',
					summary: 'Made Directus even more magical',
					notice: undefined,
					releases: [],
					dependencies: [
						{
							package: 'abc',
							from: '1.0.0',
							to: '1.0.1',
						},
						{
							package: 'def',
							from: '2.0.1',
							to: '2.1.0',
						},
					],
				},
			],
			[
				'2',
				{
					commit: 'efgh456',
					summary: 'Improved some things a little',
					notice: 'This is an example notice.',
					releases: [],
					dependencies: [
						{
							package: 'abc',
							from: '1.0.0',
							to: '1.0.1',
						},
					],
				},
			],
		]),
	);

	expect(info.dependencies).toMatchInlineSnapshot(`
		[
		  {
		    "from": "1.0.0",
		    "package": "abc",
		    "to": "1.0.1",
		  },
		  {
		    "from": "2.0.1",
		    "package": "def",
		    "to": "2.1.0",
		  },
		]
	`);
});
