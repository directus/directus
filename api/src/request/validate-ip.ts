import { useEnv } from '@directus/env';
import os from 'node:os';
import { useLogger } from '../logger.js';
import { ipInNetworks } from '../utils/ip-in-networks.js';

const deniedError = (url: string) => new Error(`Requested URL "${url}" resolves to a denied IP address`);

export function validateIp(ip: string, url: string) {
	const env = useEnv();
	const logger = useLogger();

	const ipDenyList = env['IMPORT_IP_DENY_LIST'] as string[];

	if (ipDenyList.length === 0) return;

	let denied;

	try {
		denied = ipInNetworks(ip, ipDenyList);
	} catch (error) {
		logger.warn(`Invalid "IMPORT_IP_DENY_LIST" configuration`);
		logger.warn(error);

		throw deniedError(url);
	}

	if (denied) throw deniedError(url);

	if (ipDenyList.includes('0.0.0.0')) {
		const networkInterfaces = os.networkInterfaces();

		for (const networkInfo of Object.values(networkInterfaces)) {
			if (!networkInfo) continue;

			for (const info of networkInfo) {
				if (info.address === ip) {
					throw deniedError(url);
				}
			}
		}
	}
}
