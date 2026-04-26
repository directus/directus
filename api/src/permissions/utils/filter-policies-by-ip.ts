import { ipInNetworks } from '@directus/utils/node';
import type { AccessRow } from '../lib/fetch-policies.js';

export function filterPoliciesByIp(policies: AccessRow[], ip: string | null | undefined) {
	return policies.filter(({ policy }) => {
		// Keep policies that don't have an ip address allow list configured
		if (!policy.ip_access || policy.ip_access.length === 0) {
			return true;
		}

		// When ip is null, this is a server-side accountability object (no incoming HTTP request).
		// Real user sessions always have their IP set by the authentication middleware from req.ip.
		// For server-side operations (e.g. notification permission checks), IP restrictions do not
		// apply — the check is about role-level access, not about the user's current network location.
		if (!ip) {
			return true;
		}

		return ipInNetworks(ip, policy.ip_access);
	});
}
