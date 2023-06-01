import boxen, { type Options as BoxenOptions } from 'boxen';
import chalk from 'chalk';
import type { Manifest } from '@npm/types';
import findCacheDirectory from 'find-cache-dir';
import { fetchBuilder, FileSystemCache } from 'node-fetch-cache';
import { gte, prerelease } from 'semver';

const cacheDirectory = findCacheDirectory({ name: 'directus' });

const fetch = fetchBuilder.withCache(new FileSystemCache({ ttl: 60 * 60, ...(cacheDirectory && { cacheDirectory }) }));

export async function updateCheck(currentVersion: string) {
	let packageManifest: Manifest | undefined = undefined;

	try {
		const response = await fetch('https://registry.npmjs.org/directus', {
			headers: { accept: 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*' },
		});

		if (!response.ok) {
			response.ejectFromCache();
			return;
		}

		packageManifest = await response.json();
	} catch (error) {
		// Ignore
	}

	if (!packageManifest) {
		return;
	}

	const latestVersion = packageManifest['dist-tags']['latest'];

	if (!latestVersion || gte(currentVersion, latestVersion)) {
		return;
	}

	const allVersions = Object.keys(packageManifest.versions).filter((version) => !prerelease(version));
	const indexOfCurrent = allVersions.indexOf(currentVersion);
	const indexOfLatest = allVersions.indexOf(latestVersion);

	const versionDifference =
		indexOfCurrent !== -1 && indexOfLatest !== -1 ? Math.abs(indexOfLatest - indexOfCurrent) : null;

	const message = [
		chalk.bold(`Update available!`),
		'',
		chalk.bold(`${chalk.red(currentVersion)} → ${chalk.green(latestVersion)}`),
		...(versionDifference
			? [chalk.dim(`${versionDifference} ${versionDifference > 1 ? 'versions' : 'version'} behind`)]
			: []),
		'',
		'More information:',
		chalk.blue(`https://github.com/directus/directus/releases`),
	];

	let borderColor;

	if (versionDifference && versionDifference > 5) {
		borderColor = 'red';
	} else if (versionDifference && versionDifference > 2) {
		borderColor = 'yellow';
	} else {
		borderColor = 'magenta';
	}

	const boxenOptions: BoxenOptions = {
		padding: 1,
		margin: 1,
		align: 'center',
		borderColor,
		borderStyle: 'round',
	};

	// eslint-disable-next-line no-console
	console.warn(boxen(message.join('\n'), boxenOptions));
}
