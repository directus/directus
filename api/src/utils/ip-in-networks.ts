import { matches } from 'ip-matching';

/**
 * Checks if an IP address is contained in a list of networks
 * @param networks List of IP addresses (192.168.0.1), CIDR notations (192.168.0.0/24) or IP ranges (192-168.0.0-192.168.2.0)
 * @throws Will throw if list contains invalid network definitions
 */

export function ipInNetworks(ip: string, networks: string[]) {
	for (const allowedIp of networks) {
		if (matches(ip, allowedIp)) return true;
	}

	return false;
}
