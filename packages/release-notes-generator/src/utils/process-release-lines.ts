import type { ChangelogFunctions, GetDependencyReleaseLine, GetReleaseLine } from '@changesets/types';
import type { Changesets } from '../types';

/**
 * Finds text inside an info box with the following pattern and
 * extract it seperately from the normal changeset text:
 *
 * ```md
 * ::: info
 * <my-info-text>
 * :::
 *
 * <usual-changeset-text>
 * ```
 *
 */
const summaryRegex = /(?:::: info\n+([\s\S]*)(?<!\n)\n+:::$\n*)?([\s\S]*)/m;

export function processReleaseLines(): { defaultChangelogFunctions: ChangelogFunctions; changesets: Changesets } {
	const changesets: Changesets = new Map();

	const getReleaseLine: GetReleaseLine = async (changeset) => {
		const { id, summary, ...rest } = changeset;

		if (changesets.has(id)) {
			return '';
		}

		const match = summary.match(summaryRegex);
		const info = match?.[1];
		const finalSummary = match?.[2] || '';

		changesets.set(id, { summary: finalSummary, info, ...rest });

		return '';
	};

	const getDependencyReleaseLine: GetDependencyReleaseLine = async () => {
		// Cannot be used since there's no way to get the affected dependency
		return '';
	};

	const defaultChangelogFunctions = {
		getReleaseLine,
		getDependencyReleaseLine,
	};

	return { defaultChangelogFunctions, changesets };
}
