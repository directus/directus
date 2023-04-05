import { URL } from 'node:url';
import { gte } from 'semver';
import { fetch } from 'undici';

/**
 * Check if a given package version is the most up to date release of that package. Returns the
 * latest version string if package is not up to date, returns null if package is up to date.
 */
export const isUpToDate = async (name: string, version: string): Promise<string | null> => {
	const url = new URL(name, 'https://registry.npmjs.org');

	const response = await fetch(url, {
		headers: {
			accept: 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*',
		},
	});

	if (!response.ok) {
		throw new Error(`Couldn't find latest version for package "${name}": ${response.status} ${response.statusText}`);
	}

	const packageInformation = (await response.json()) as { 'dist-tags': { [key: string]: string } };

	const latest = packageInformation?.['dist-tags']?.['latest'];

	if (!latest) {
		throw new Error(`Couldn't find latest version for package "${name}"`);
	}

	const upToDate = gte(version, latest);

	if (upToDate === false) {
		return latest;
	}

	return null;
};
