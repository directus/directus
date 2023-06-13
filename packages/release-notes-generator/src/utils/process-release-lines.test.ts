import { NewChangesetWithCommit, VersionType } from '@changesets/types';
import { expect, test } from 'vitest';
import { processReleaseLines } from './process-release-lines';

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
		},
	});
});
