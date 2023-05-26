import { NOTICE_TYPE, REPO, VERSIONS_TITLE } from '../constants';
import type { Change, Notice, Package, PackageVersion, Type, UntypedPackage } from '../types';

type Section = Type & { notices: Notice[] };

export function generateMarkdown(
	mainVersion: string,
	notices: Notice[],
	types: Type[],
	untypedPackages: UntypedPackage[],
	packageVersions: PackageVersion[]
): string {
	let foundNoticeSection = false;

	let sections: Section[] = types.map((type) => {
		if (type.title === NOTICE_TYPE) {
			foundNoticeSection = true;
			return { title: type.title, packages: type.packages, notices };
		}

		return { title: type.title, packages: type.packages, notices: [] };
	});

	if (!foundNoticeSection) {
		sections = [{ title: NOTICE_TYPE, packages: [], notices }, ...sections];
	}

	const date = new Date();

	const dateString = new Intl.DateTimeFormat('en-US', {
		dateStyle: 'long',
	}).format(date);

	let output = `## v${mainVersion} (${dateString})`;

	for (const { title, packages, notices } of sections) {
		if (packages.length > 0 || notices.length > 0) {
			output += `\n\n### ${title}`;
		}

		if (notices.length > 0) {
			output += '\n\n';
			output += formatNotices(notices);
		}

		if (packages.length > 0) {
			output += '\n\n';
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

function formatNotices(notices: Notice[]): string {
	const noticesOutput = notices.map((notice) => {
		let noticeOutput = `**${formatChange(notice.change, false)}**`;
		return (noticeOutput += `\n${notice.notice}`);
	});

	return noticesOutput.join('\n\n');
}

function formatPackages(packages: Package[]): string {
	const packagesOutput = packages.map(({ name, changes }) => {
		let packageOutput = '';

		if (changes.length > 0) {
			packageOutput += `- **${name}**\n`;

			packageOutput += formatChanges(changes)
				.map((change) => `  ${change}`)
				.join('\n');
		}

		return packageOutput;
	});

	return packagesOutput.join('\n');
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
