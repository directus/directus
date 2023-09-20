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
		},
	],
	[
		'2',
		{
			commit: 'efgh456',
			summary: 'Improved some things a little',
			notice: 'This is an example notice.',
			releases: [{ name: 'docs', type: 'minor' }],
		},
	],
]);

test('should compose info from changesets', async () => {
	const info = await getInfo(changesets);

	expect(info).toMatchInlineSnapshot(`
		{
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
