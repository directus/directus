import { ipInNetworks } from '@directus/utils/node';
import type { AccessRow } from '../lib/fetch-policies.js';

export function filterPoliciesByIp(policies: AccessRow[], ip: string | null | undefined) {
	return policies.filter(({ policy }) => {
		// Keep policies that don't have an ip address allow list configured
		if (!policy.ip_access || policy.ip_access.length === 0) {
			return true;
		}

		// If the client's IP address is unknown, we can't validate it against the allow list and will
		// have to default to the more secure option of preventing access
		if (!ip) {
			return false;
		}

		return ipInNetworks(ip, policy.ip_access);
	});
}
