import type { ChangelogFunctions, GetDependencyReleaseLine, GetReleaseLine } from '@changesets/types';
import type { Changesets } from '../types';

export function processReleaseLines(): { defaultChangelogFunctions: ChangelogFunctions; changesets: Changesets } {
	const changesets: Changesets = new Map();

	const getReleaseLine: GetReleaseLine = async (changeset) => {
		const { id, summary, ...rest } = changeset;

		if (changesets.has(id)) {
			return '';
		}

		// Find text inside a notice box with the following pattern and
		// extract it from the normal changeset summary:
		//
		//   ::: notice
		//   <my-notice>
		//   :::
		//
		//   <normal-changeset-summary>
		const finalSummary = summary.replace(/^::: notice\n[\s\S]*^:::$/m, '').trim();
		const notice = summary.match(/::: notice\n+([\s\S]*)(?<!\n)\n+:::$/m)?.[1];

		changesets.set(id, { summary: finalSummary, notice, ...rest });

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
