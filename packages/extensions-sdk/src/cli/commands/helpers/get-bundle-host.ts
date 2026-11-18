import type { ExtensionType } from '@directus/types';
import semver from 'semver';
import getDefaultHost from './get-default-host.js';

export default function getBundleHost(host: string, types: ExtensionType[]): string {
	if (!semver.validRange(host)) return host;

	let bundleHost = host;
	let bundleMin = semver.minVersion(host)!;

	for (const type of types) {
		const entryHost = getDefaultHost(type);
		const entryMin = semver.minVersion(entryHost)!;

		if (semver.gt(entryMin, bundleMin)) {
			bundleHost = entryHost;
			bundleMin = entryMin;
		}
	}

	return bundleHost;
}
