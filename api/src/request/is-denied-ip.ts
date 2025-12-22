import { useEnv } from '@directus/env';
import { ipInNetworks } from '@directus/utils/node';
import { matches } from 'ip-matching';
import os from 'node:os';
import { useLogger } from '../logger/index.js';

export function isDeniedIp(ip: string): boolean {
	const env = useEnv();
	const logger = useLogger();

	const ipDenyList = env['IMPORT_IP_DENY_LIST'] as string[];

	if (ipDenyList.length === 0) return false;

	try {
		const denied = ipInNetworks(ip, ipDenyList);

		if (denied) return true;
	} catch (error) {
		logger.warn(`Cannot verify IP address due to invalid "IMPORT_IP_DENY_LIST" config`);
		logger.warn(error);

		return true;
	}

	if (ipDenyList.includes('0.0.0.0')) {
		const networkInterfaces = os.networkInterfaces();

		for (const networkInfo of Object.values(networkInterfaces)) {
			if (!networkInfo) continue;

			for (const info of networkInfo) {
				if (info.internal && info.cidr) {
					if (matches(ip, info.cidr)) return true;
				} else if (info.address === ip) {
					return true;
				}
			}
		}
	}

	return false;
}
