import { NewChangesetWithCommit, VersionType } from '@changesets/types';
import { expect, test } from 'vitest';
import { processReleaseLines } from './process-release-lines.js';

test('should process release lines', async () => {
	const { defaultChangelogFunctions, changesets } = processReleaseLines();

	const changeset: NewChangesetWithCommit = {
		id: 'random-changeset-name',
		summary: 'Example summary',
		commit: 'abcdefg',
		releases: [
			{
				name: 'directus',
				type: 'patch',
			},
		],
	};

	const type: VersionType = 'patch';

	await defaultChangelogFunctions.getReleaseLine(changeset, type, null);

	const result = Array.from(changesets, ([key, value]) => ({ key, value }));

	expect(result[0]).toEqual({
		key: 'random-changeset-name',
		value: {
			commit: 'abcdefg',
			info: undefined,
			releases: [
				{
					name: 'directus',
					type: 'patch',
				},
			],
			summary: 'Example summary',
			dependencies: [],
		},
	});
});

test('should extract notice from summary', async () => {
	const { defaultChangelogFunctions, changesets } = processReleaseLines();

	const changeset: NewChangesetWithCommit = {
		id: 'random-changeset-name',
		summary: '::: notice\nInfo text\n:::\n\nSummary text',
		commit: 'abcdefg',
		releases: [
			{
				name: 'directus',
				type: 'patch',
			},
		],
	};

	const type: VersionType = 'patch';

	await defaultChangelogFunctions.getReleaseLine(changeset, type, null);

	const result = Array.from(changesets, ([key, value]) => ({ key, value }));

	expect(result[0]).toEqual({
		key: 'random-changeset-name',
		value: {
			commit: 'abcdefg',
			notice: 'Info text',
			releases: [
				{
					name: 'directus',
					type: 'patch',
				},
			],
			summary: 'Summary text',
			dependencies: [],
		},
	});
});

test('should process dependency bumps', async () => {
	const { defaultChangelogFunctions, changesets } = processReleaseLines();

	const changeset: NewChangesetWithCommit = {
		id: 'random-changeset-name',
		summary: `Updated the following dependencies:
- Updated axios-cache-interceptor dependency from 1.8.0 to 1.8.3
- Updated chalk dependency from 5.4.1 to 5.6.2
`,
		commit: 'abcdefg',
		releases: [
			{
				name: 'directus',
				type: 'patch',
			},
		],
	};

	const type: VersionType = 'patch';

	await defaultChangelogFunctions.getReleaseLine(changeset, type, null);

	const result = Array.from(changesets, ([key, value]) => ({ key, value }));

	expect(result[0]).toEqual({
		key: 'random-changeset-name',
		value: {
			commit: 'abcdefg',
			notice: undefined,
			releases: [
				{
					name: 'directus',
					type: 'patch',
				},
			],
			summary: 'Updated the following dependencies:',
			dependencies: [
				{
					from: '1.8.0',
					package: 'axios-cache-interceptor',
					to: '1.8.3',
				},
				{
					from: '5.4.1',
					package: 'chalk',
					to: '5.6.2',
				},
			],
		},
	});
});
