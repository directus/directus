import type { ChangelogFunctions, GetDependencyReleaseLine, GetReleaseLine } from '@changesets/types';
import { execSync } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { generateMarkdown } from './generate-markdown';
import { getInfo } from './get-info';
import { ChangesetsWithoutId, PackageInfo } from './types';

const changesets: ChangesetsWithoutId = new Map();

const getReleaseLine: GetReleaseLine = async (changeset) => {
	const { id, ...rest } = changeset;
	changesets.set(id, rest);

	return '';
};

const getDependencyReleaseLine: GetDependencyReleaseLine = async () => {
	// Update of dependencies not included in the release notes
	return '';
};

const defaultChangelogFunctions: ChangelogFunctions = {
	getReleaseLine,
	getDependencyReleaseLine,
};

const run = async () => {
	const packageInfo: PackageInfo[] = JSON.parse(String(execSync('pnpm m ls --json --depth=-1')));

	const mainVersion = packageInfo.find((p) => p.name === 'directus')?.version;

	if (!mainVersion) {
		throw new Error(`Couldn't get main version`);
	}

	// Clean-up changelog files in favor of release notes
	for (const localPackage of packageInfo) {
		const changelogPath = join(localPackage.path, 'CHANGELOG.md');

		if (existsSync(changelogPath)) {
			unlinkSync(changelogPath);
		}
	}

	const { types, untypedPackages, packageVersions } = await getInfo(changesets);
	generateMarkdown(mainVersion, types, untypedPackages, packageVersions);
};

process.on('beforeExit', async () => {
	await run();
	process.exit();
});

export default defaultChangelogFunctions;
