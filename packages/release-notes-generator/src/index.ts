import { appendFile } from 'node:fs/promises';
import { generateMarkdown } from './utils/generate-markdown.js';
import { getInfo } from './utils/get-info.js';
import { processPackages } from './utils/process-packages.js';
import { processReleaseLines } from './utils/process-release-lines.js';

const { defaultChangelogFunctions, changesets } = processReleaseLines();

// Take over control after `changesets` has finished
process.on('beforeExit', async () => {
	await run();
	process.exit();
});

async function run() {
	const { mainVersion, isPrerelease, prereleaseId, packageVersions } = await processPackages();

	const { types, untypedPackages, notices } = await getInfo(changesets);

	if (types.length === 0 && untypedPackages.length === 0 && packageVersions.length === 0) {
		// eslint-disable-next-line no-console
		console.warn('WARN: No processable changesets found');
	}

	const markdown = generateMarkdown(notices, types, untypedPackages, packageVersions);

	const divider = '==============================================================';
	// eslint-disable-next-line no-console
	console.log(`${divider}\nDirectus v${mainVersion}\n${divider}\n${markdown}\n${divider}`);

	const githubOutput = process.env['GITHUB_OUTPUT'];

	// Set outputs if running inside a GitHub workflow
	if (githubOutput) {
		const outputs = [
			`DIRECTUS_VERSION=${mainVersion}`,
			`DIRECTUS_PRERELEASE=${isPrerelease}`,
			...(prereleaseId ? [`DIRECTUS_PRERELEASE_ID=${prereleaseId}`] : []),
			`DIRECTUS_RELEASE_NOTES<<EOF_RELEASE_NOTES\n${markdown}\nEOF_RELEASE_NOTES`,
		];

		await appendFile(githubOutput, `${outputs.join('\n')}\n`);
	}
}

export default defaultChangelogFunctions;
