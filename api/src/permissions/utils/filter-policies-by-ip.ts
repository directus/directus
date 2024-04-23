import { ipInNetworks } from '../../utils/ip-in-networks.js';
import type { AccessRow } from '../modules/process-ast/types.js';

export function filterPoliciesByIp(policies: AccessRow[], ip: string | null | undefined) {
	return policies.filter(({ policy }) => {
		const ipAllowList = policy.ip_access?.split(',') ?? null;

		// Keep policies that don't have an ip address allow list configured
		if (!ipAllowList) {
			return true;
		}

		// If the client's IP address is unknown, we can't validate it against the allow list and will
		// have to default to the more secure option of preventing access
		if (!ip) {
			return false;
		}

		return ipInNetworks(ip, ipAllowList);
	});
}
