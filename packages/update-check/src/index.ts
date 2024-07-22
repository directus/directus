import type { Manifest } from '@npm/types';
import Axios from 'axios';
import { setupCache } from 'axios-cache-interceptor';
import boxen, { type Options as BoxenOptions } from 'boxen';
import chalk from 'chalk';
import { gte, prerelease } from 'semver';
import { getCache } from './cache.js';

const cache = await getCache();
const instance = Axios.create();
const axios = cache ? setupCache(instance, { storage: cache }) : instance;

export async function updateCheck(currentVersion: string) {
	let packageManifest: Partial<Manifest> | null;

	try {
		const response = await axios.get('https://registry.npmjs.org/directus', {
			headers: { accept: 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*' },
			timeout: 8_000,
		});

		packageManifest = response.data;
	} catch {
		// Errors are intentionally ignored and update check is skipped
		return;
	}

	const latestVersion = packageManifest?.['dist-tags']?.['latest'];
	const versions = packageManifest?.versions;

	if (!latestVersion || !versions || gte(currentVersion, latestVersion)) return;

	const allVersions = Object.keys(versions).filter((version) => !prerelease(version));
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
