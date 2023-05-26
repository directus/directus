import { REPO, VERSIONS_TITLE } from '../constants';
import type { Change, Notice, Package, PackageVersion, Type, UntypedPackage } from '../types';

export function generateMarkdown(
	mainVersion: string,
	notices: Notice[],
	types: Type[],
	untypedPackages: UntypedPackage[],
	packageVersions: PackageVersion[]
): string {
	const date = new Date();

	const dateString = new Intl.DateTimeFormat('en-US', {
		dateStyle: 'long',
	}).format(date);

	let output = `## v${mainVersion} (${dateString})`;

	for (const notice of notices) {
		output += `\n\n${formatNotice(notice)}`;
	}

	for (const { title, packages } of types) {
		if (packages.length > 0) {
			output += `\n\n### ${title}\n`;
			output += formatPackages(packages);
		}
	}

	for (const { name, changes } of untypedPackages) {
		if (changes.length > 0) {
			output += `\n\n### ${name}\n\n`;
			output += formatChanges(changes).join('\n');
		}
	}

	if (packageVersions.length > 0) {
		output += `\n\n### ${VERSIONS_TITLE}\n`;
	}

	for (const { name, version } of packageVersions) {
		output += `\n- \`${name}@${version}\``;
	}

	return output;
}

function formatNotice(notice: Notice): string {
	let output = '';

	output += formatChange(notice.change, false);
	output += notice.notice;

	return output
		.split('\n')
		.map((line) => `> ${line}`)
		.join('\n');
}

function formatPackages(packages: Package[]): string {
	let output = '';

	for (const { name, changes } of packages) {
		if (changes.length > 0) {
			output += `\n- **${name}**\n`;

			output += formatChanges(changes)
				.map((change) => `  ${change}`)
				.join('\n');
		}
	}

	return output;
}

function formatChanges(changes: Change[]): string[] {
	return changes.map((change) => `- ${formatChange(change)}`);
}

function formatChange(change: Change, includeUser = true): string {
	let refUser = '';
	const refUserContent = [];

	if (change.githubInfo?.links.pull) {
		refUserContent.push(change.githubInfo.links.pull);
	} else if (change.githubInfo?.links.commit) {
		refUserContent.push(change.githubInfo.links.commit);
	} else if (change.commit) {
		refUserContent.push(`[${change.commit}](https://github.com/${REPO}/commit/${change.commit})`);
	}

	if (includeUser && change.githubInfo?.user) {
		refUserContent.push(`by @${change.githubInfo.user}`);
	}

	if (refUserContent.length > 0) {
		refUser = ' (';
		refUser += refUserContent.join(' ');
		refUser += ')';
	}

	return `${change.summary}${refUser}`;
}
