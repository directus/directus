import { getInfo as getGithubInfo } from '@changesets/get-github-info';
import { execSync } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { FILTERED_PACKAGES, PACKAGE_ORDER, REPO, TYPE_MAP, UNTYPED_PACKAGES } from './constants';
import { Change, ChangesetsWithoutId, Package, PackageInfo, PackageVersion, Type } from './types';

export async function getInfo(changesets: ChangesetsWithoutId) {
	const types: Type[] = [];
	const untypedPackages: Package[] = [];
	const packageVersions = new Map<string, string>();

	const packageInfo: PackageInfo[] = JSON.parse(String(execSync('pnpm m ls --json --depth=-1')));

	const mainVersion = packageInfo.find((p) => p.name === 'directus')?.version;

	if (!mainVersion) {
		throw new Error(`Couldn't get main version`);
	}

	for (const localPackage of packageInfo) {
		const changelogPath = join(localPackage.path, 'CHANGELOG.md');

		if (existsSync(changelogPath)) {
			unlinkSync(changelogPath);
		}
	}

	for (const { summary, commit, releases } of changesets.values()) {
		let githubInfo;

		if (commit) {
			githubInfo = await getGithubInfo({
				repo: REPO,
				commit: commit,
			});
		}

		for (const { type, name } of releases) {
			const change: Change = { summary, commit, githubInfo };

			if (FILTERED_PACKAGES.includes(name)) {
				continue;
			}

			const untypedPackage = UNTYPED_PACKAGES[name];

			if (untypedPackage) {
				const packageInUntypedPackages = untypedPackages.find((p) => p.name === untypedPackage);

				if (packageInUntypedPackages) {
					packageInUntypedPackages.changes.push(change);
				} else {
					untypedPackages.push({
						name: untypedPackage,
						changes: [change],
					});
				}

				continue;
			}

			if (!packageVersions.has(name)) {
				const version = packageInfo.find((p) => p.name === name)?.version;

				if (version) {
					packageVersions.set(name, version);
				}
			}

			const typeTitle = TYPE_MAP[type];
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

	const typeOrder = Object.values(TYPE_MAP);

	types.sort((a, b) => {
		return typeOrder.indexOf(a.title) - typeOrder.indexOf(b.title);
	});

	for (const { packages } of types) {
		packages.sort((a, b) => {
			const indexOfA = PACKAGE_ORDER.indexOf(a.name);
			const indexOfB = PACKAGE_ORDER.indexOf(b.name);
			if (indexOfA >= 0 && indexOfB >= 0) return indexOfA - indexOfB;

			if (indexOfA >= 0) {
				return -1;
			}

			return 0;
		});
	}

	const untypedPackagesOrder = Object.values(UNTYPED_PACKAGES);

	untypedPackages.sort((a, b) => {
		return untypedPackagesOrder.indexOf(a.name) - untypedPackagesOrder.indexOf(b.name);
	});

	const sortedPackageVersions: PackageVersion[] = Array.from(packageVersions, ([name, version]) => ({
		name,
		version,
	}));

	sortedPackageVersions.sort((a, b) => {
		const indexOfA = PACKAGE_ORDER.indexOf(a.name);
		const indexOfB = PACKAGE_ORDER.indexOf(b.name);
		if (indexOfA >= 0 && indexOfB >= 0) return indexOfA - indexOfB;

		if (indexOfA >= 0) {
			return -1;
		}

		return 0;
	});

	return { types, untypedPackages, packageVersions: sortedPackageVersions };
}
