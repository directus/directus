import { REPO, VERSIONS_TITLE } from './constants';
import { Change, Package, PackageVersion, Type } from './types';

export function generateMarkdown(
	mainVersion: string,
	types: Type[],
	untypedPackages: Package[],
	packageVersions: PackageVersion[]
) {
	const date = new Date();

	const dateString = new Intl.DateTimeFormat('en-US', {
		dateStyle: 'long',
	}).format(date);

	let markdownOutput = `## v${mainVersion} (${dateString})`;

	for (const { title, packages } of types) {
		markdownOutput += `\n\n### ${title}\n`;
		markdownOutput += formatPackages(packages);
	}

	for (const { name, changes } of untypedPackages) {
		markdownOutput += `\n\n### ${name}\n\n`;
		markdownOutput += formatChanges(changes).join('\n');
	}

	if (packageVersions.length > 0) {
		markdownOutput += `\n\n### ${VERSIONS_TITLE}\n`;
	}

	for (const { name, version } of packageVersions) {
		markdownOutput += `\n- \`${name}@${version}\``;
	}

	const divider = '==============================================================';
	// eslint-disable-next-line no-console
	console.log(divider);
	// eslint-disable-next-line no-console
	console.log(markdownOutput);
	// eslint-disable-next-line no-console
	console.log(divider);
}

function formatPackages(packages: Package[]) {
	let output = '';

	for (const { name, changes } of packages) {
		output += `\n- **${name}**\n`;

		output += formatChanges(changes)
			.map((change) => `  ${change}`)
			.join('\n');
	}

	return output;
}

function formatChanges(changes: Change[]) {
	return changes.map((change) => {
		let refUser = '';

		const refUserContent = [];

		if (change.githubInfo?.links.pull) {
			refUserContent.push(change.githubInfo.links.pull);
		} else if (change.githubInfo?.links.commit) {
			refUserContent.push(change.githubInfo.links.commit);
		} else if (change.commit) {
			refUserContent.push(`[${change.commit}](https://github.com/${REPO}/commit/${change.commit})`);
		}

		if (change.githubInfo?.user) {
			refUserContent.push(`by @${change.githubInfo.user}`);
		}

		if (refUserContent.length > 0) {
			refUser = ' (';
			refUser += refUserContent.join(' ');
			refUser += ')';
		}

		return `- ${change.summary}${refUser}`;
	});
}
