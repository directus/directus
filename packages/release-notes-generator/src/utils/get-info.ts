import { getInfo as getGithubInfo } from '@changesets/get-github-info';
import config from '../config.js';
import type { Change, Changesets, DependencyChange, Notice, Type, UntypedPackage } from '../types.js';
import { sortByExternalOrder, sortByObjectValues } from './sort.js';

export async function getInfo(changesets: Changesets): Promise<{
	types: Type[];
	untypedPackages: UntypedPackage[];
	notices: Notice[];
	dependencies: DependencyChange[];
}> {
	const types: Type[] = [];
	const untypedPackages: UntypedPackage[] = [];
	const notices: Notice[] = [];
	const dependenciesMap: Record<string, DependencyChange> = {};

	for (const { summary, notice, commit, releases, dependencies } of changesets.values()) {
		let githubInfo;

		if (commit) {
			githubInfo = await getGithubInfo({
				repo: config.repo,
				commit: commit,
			});
		}

		const change: Change = { summary, commit, githubInfo };

		if (notice) {
			notices.push({ notice, change });
		}

		for (const dep of dependencies) {
			const existing = dependenciesMap[dep.package];

			if (existing) {
				if (dep.from !== existing.from || dep.to !== existing.to)
					// eslint-disable-next-line no-console
					console.warn(
						`Ignoring duplicate dependency update ${dep.package} to ${dep.to}. Using ${existing.to} instead.`,
					);
				continue;
			}

			dependenciesMap[dep.package] = dep;
		}

		for (const { type, name } of releases) {
			if (name === config.mainPackage || !summary) {
				continue;
			}

			const untypedTitle = config.untypedPackageTitles[name];

			if (untypedTitle) {
				const packageInUntypedPackages = untypedPackages.find((p) => p.name === untypedTitle);

				if (packageInUntypedPackages) {
					packageInUntypedPackages.changes.push(change);
				} else {
					untypedPackages.push({
						name: untypedTitle,
						changes: [change],
					});
				}

				continue;
			}

			const typeTitle = config.typedTitles[type];
			const typeInTypes = types.find((t) => t.title === typeTitle);

			if (typeInTypes) {
				const packageInPackages = typeInTypes.packages.find((p) => p.name === name);

				if (packageInPackages) {
					packageInPackages.changes.push(change);
				} else {
					typeInTypes.packages.push({
						name,
						changes: [change],
					});
				}
			} else {
				types.push({ title: typeTitle, packages: [{ name, changes: [change] }] });
			}
		}
	}

	types.sort(sortByObjectValues(config.typedTitles, 'title'));

	for (const { packages } of types) {
		packages.sort(sortByExternalOrder(config.packageOrder, 'name'));
	}

	untypedPackages.sort(sortByObjectValues(config.untypedPackageTitles, 'name'));

	return { types, untypedPackages, notices, dependencies: Object.values(dependenciesMap) };
}
