import { IpBlocklist } from './ip-blocklist.js';

/**
 * Checks if an IP address is contained in a list of networks
 * @param networks List of IP addresses (192.168.0.1), CIDR notations (192.168.0.0/24) or IP ranges (192-168.0.0-192.168.2.0)
 * @throws Will throw if list contains invalid network definitions
 */

export function ipInNetworks(ip: string, networks: string[]): boolean {
	const blockList = new IpBlocklist();

	for (const blockNetworkRaw of networks) {
		const blockNetwork = blockNetworkRaw.trim();

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

	return blockList.checkAddress(ip);
}
