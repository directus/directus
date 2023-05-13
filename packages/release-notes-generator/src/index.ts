import type { ChangelogFunctions, GetDependencyReleaseLine, GetReleaseLine } from '@changesets/types';
import { appendFileSync } from 'node:fs';
import { MAIN_PACKAGE } from './constants';
import type { ChangesetsWithoutId } from './types';
import { generateMarkdown } from './utils/generate-markdown';
import { getInfo } from './utils/get-info';
import { processPackages } from './utils/process-packages';

const changesets: ChangesetsWithoutId = new Map();

const getReleaseLine: GetReleaseLine = async (changeset) => {
	const { id, ...rest } = changeset;
	changesets.set(id, rest);

	return '';
};

const getDependencyReleaseLine: GetDependencyReleaseLine = async () => {
	// Cannot be used since there's no way to get the affected dependency
	return '';
};

process.on('beforeExit', async () => {
	await run();
	process.exit();
});

async function run() {
	const { mainVersion, packageVersions } = await processPackages();

	if (changesets.size === 0) {
		earlyExit();
	}

	if (!mainVersion) {
		throw new Error(`Couldn't get main version ('${MAIN_PACKAGE}' package)`);
	}

	const { types, untypedPackages } = await getInfo(changesets);

	if (types.length === 0 && untypedPackages.length === 0 && packageVersions.length === 0) {
		earlyExit();
	}

	const markdown = generateMarkdown(mainVersion, types, untypedPackages, packageVersions);

	const divider = '==============================================================';
	process.stdout.write(`${divider}\n${markdown}\n${divider}\n`);

	const githubOutput = process.env['GITHUB_OUTPUT'];

	// Set output if running inside a GitHub workflow
	if (githubOutput) {
		const outputs = [
			`DIRECTUS_MAIN_VERSION=${mainVersion}`,
			`DIRECTUS_RELEASE_NOTES<<EOF_RELEASE_NOTES\n${markdown}\nEOF_RELEASE_NOTES`,
		];

		appendFileSync(githubOutput, `${outputs.join('\n')}\n`);
	}
}

function earlyExit(): never {
	process.stdout.write('No (processable) changesets found: Skipping generation of release notes\n');
	process.exit();
}

const defaultChangelogFunctions: ChangelogFunctions = {
	getReleaseLine,
	getDependencyReleaseLine,
};

export default defaultChangelogFunctions;
