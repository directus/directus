import { REPO } from './constants';
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

	let markdownOutput = `## ${mainVersion} (${dateString})`;

	for (const { title, packages } of types) {
		markdownOutput += `\n\n### ${title}\n`;
		markdownOutput += formatPackages(packages);
	}

	for (const { name, changes } of untypedPackages) {
		markdownOutput += `\n\n### ${name}\n\n`;
		markdownOutput += formatChanges(changes).join('\n');
	}

	if (packageVersions.length > 0) {
		markdownOutput += '\n\n### Published Versions\n';
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
		let ref;

		if (change.githubInfo?.links.pull) {
			ref = change.githubInfo.links.pull;
		} else if (change.githubInfo?.links.commit) {
			ref = change.githubInfo.links.commit;
		} else if (change.commit) {
			ref = `[${change.commit}](https://github.com/${REPO}/commit/${change.commit})`;
		}

		let user;

		if (change.githubInfo?.links.user) {
			user = `by ${change.githubInfo.links.user}`;
		}

		let refUser = '';

		const refUserContent = [];

		if (ref) {
			refUserContent.push(ref);
		}

		if (user) {
			refUserContent.push(user);
		}

		if (refUserContent.length > 0) {
			refUser = ' (';
			refUser += refUserContent.join(' ');
			refUser += ')';
		}

		return `- ${change.summary}${refUser}`;
	});
}
