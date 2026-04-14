import { useEnv } from '@directus/env';
import { IpBlocklist } from '@directus/utils/node';
import { useLogger } from '../logger/index.js';

export function isDeniedIp(ip: string): boolean {
	const env = useEnv();
	const logger = useLogger();

	const ipDenyList = env['IMPORT_IP_DENY_LIST'] as string[];
	if (ipDenyList.length === 0) return false;

	const blockList = new IpBlocklist();
	let blockNetworkInterfaces = false;

	try {
		for (const blockNetworkRaw of ipDenyList) {
			const blockNetwork = blockNetworkRaw.trim();

			if (blockNetwork === '0.0.0.0') {
				blockNetworkInterfaces = true;
				continue;
			}

			if (blockNetwork.includes('-')) {
				blockList.parseRange(blockNetwork);
				continue;
			}

			if (blockNetwork.includes('/')) {
				blockList.parseSubnet(blockNetwork);
				continue;
			}

			blockList.parseAddress(blockNetwork);
		}

		if (blockNetworkInterfaces) {
			blockList.addLocalNetworkInterfaces();
		}
	} catch (error) {
		// error adding blocked ranges to the blocklist
		logger.warn(`Cannot verify IP address due to invalid "IMPORT_IP_DENY_LIST" config`);
		logger.warn(error);
		return true;
	}

	return blockList.checkAddress(ip);
}
