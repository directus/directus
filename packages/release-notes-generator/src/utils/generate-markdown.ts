import config from '../config.js';
import type { Change, Notice, Package, PackageVersion, Type, UntypedPackage } from '../types.js';

type Section = Type & { notices: Notice[] };

export function generateMarkdown(
	notices: Notice[],
	types: Type[],
	untypedPackages: UntypedPackage[],
	packageVersions: PackageVersion[],
): string {
	// Generate sections out of types and include notices
	let foundNoticeSection = false;

	const noticeTypeTitle = config.typedTitles[config.noticeType];

	let sections: Section[] = types.map((type) => {
		if (type.title === noticeTypeTitle) {
			foundNoticeSection = true;
			return { title: type.title, packages: type.packages, notices };
		}

		return { title: type.title, packages: type.packages, notices: [] };
	});

	if (notices.length > 0 && !foundNoticeSection) {
		sections = [{ title: noticeTypeTitle, packages: [], notices }, ...sections];
	}

	const output = [];

	output.push(formatSections(sections));

	output.push(formatUntypedPackages(untypedPackages));

	output.push(formatPackageVersions(packageVersions));

	return output.filter((o) => o).join('\n\n');
}

function formatSections(sections: Section[]): string {
	const output = [];

	for (const { title, packages, notices } of sections) {
		if (packages.length === 0 && notices.length === 0) {
			continue;
		}

		let lines = `### ${title}`;

		if (notices.length > 0) {
			lines += '\n\n';
			lines += formatNotices(notices);
		}

		if (packages.length > 0) {
			lines += '\n\n';
			lines += formatPackages(packages);
		}

		output.push(lines);
	}

	return output.join('\n\n');
}

function formatNotices(notices: Notice[]): string {
	const output = notices.map((notice) => {
		let lines = `**${formatChange(notice.change, true)}**\n`;
		return (lines += `${notice.notice}`);
	});

	return output.join('\n\n');
}

function formatPackages(packages: Package[]): string {
	const output = packages.map(({ name, changes }) => {
		let lines = '';

		if (changes.length > 0) {
			lines += `- **${name}**\n`;

			lines += formatChanges(changes)
				.map((change) =>
					change
						.split('\n')
						.map((line) => `  ${line}`)
						.join('\n'),
				)
				.join('\n');
		}

		return lines;
	});

	return output.join('\n');
}

function formatUntypedPackages(untypedPackages: UntypedPackage[]): string {
	const output = [];

	for (const { name, changes } of untypedPackages) {
		if (changes.length == 0) {
			continue;
		}

		let lines = `### ${name}\n\n`;
		lines += formatChanges(changes).join('\n');

		output.push(lines);
	}

	return output.join('\n\n');
}

function formatChanges(changes: Change[]): string[] {
	return changes.map((change) => {
		const lines = [];

		const [firstLine, ...remainingLines] = formatChange(change).split('\n');

		lines.push(`- ${firstLine}`);

		if (remainingLines.length > 0) {
			lines.push(...remainingLines.map((line) => `  ${line}`));
		}

		return lines.join('\n');
	});
}

function formatChange(change: Change, short?: boolean): string {
	let refUser = '';
	const refUserContent = [];

	if (change.githubInfo?.links.pull) {
		refUserContent.push(change.githubInfo.links.pull);
	} else if (change.githubInfo?.links.commit) {
		refUserContent.push(change.githubInfo.links.commit);
	} else if (change.commit) {
		refUserContent.push(`[${change.commit}](https://github.com/${config.repo}/commit/${change.commit})`);
	}

	if (!short && change.githubInfo?.user) {
		refUserContent.push(`by @${change.githubInfo.user}`);
	}

	if (refUserContent.length > 0) {
		refUser = ' (';
		refUser += refUserContent.join(' ');
		refUser += ')';
	}

	const [firstSummaryLine, ...remainingSummaryLines] = change.summary.split('\n');

	const title = short && remainingSummaryLines.length > 0 ? `${firstSummaryLine}...` : firstSummaryLine;
	const additionalLines = !short && remainingSummaryLines.length > 0 ? `\n${remainingSummaryLines.join('\n')}` : '';

	return `${title}${refUser}${additionalLines}`;
}

function formatPackageVersions(packageVersions: PackageVersion[]): string {
	let lines = '';

	if (packageVersions.length > 0) {
		lines += `### ${config.versionTitle}\n`;
	}

	for (const { name, version } of packageVersions) {
		lines += `\n- \`${name}@${version}\``;
	}

	return lines;
}
