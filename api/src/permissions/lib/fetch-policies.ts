import type { Accountability, Filter } from '@directus/types';
import type { Context } from '../types.js';
import { filterPoliciesByIp } from '../utils/filter-policies-by-ip.js';
import { withCache } from '../utils/with-cache.js';

export interface AccessRow {
	policy: { id: string; ip_access: string[] | null };
	role: string | null;
}

export const fetchPolicies = withCache('policies', _fetchPolicies, ({ roles, user, ip, bypassIpRestrictions }) => ({
	roles,
	user,
	ip,
	bypassIpRestrictions,
}));

/**
 * Fetch the policies associated with the current user accountability
 */
export async function _fetchPolicies(
	{ roles, user, ip, bypassIpRestrictions }: Pick<Accountability, 'user' | 'roles' | 'ip' | 'bypassIpRestrictions'>,
	context: Context,
): Promise<string[]> {
	const { AccessService } = await import('../../services/access.js');
	const accessService = new AccessService(context);

	let roleFilter: Filter;

	if (roles.length === 0) {
		// Users without role assumes the Public role permissions along with their attached policies
		roleFilter = { _and: [{ role: { _null: true } }, { user: { _null: true } }] };
	} else {
		roleFilter = { role: { _in: roles } };
	}

	// If the user is not null, we also want to include the policies attached to the user
	const filter = user ? { _or: [{ user: { _eq: user } }, roleFilter] } : roleFilter;

	const accessRows = (await accessService.readByQuery({
		filter,
		fields: ['policy.id', 'policy.ip_access', 'role'],
		limit: -1,
	})) as AccessRow[];

	// Skip IP filtering for background operations (e.g. notification permission checks)
	// where the mentioned user's IP is unknown but access should be evaluated at role level.
	const filteredAccessRows = bypassIpRestrictions ? accessRows : filterPoliciesByIp(accessRows, ip);

	/*
	 * Sort rows by priority (goes bottom up):
	 * - Parent role policies
	 * - Child role policies
	 * - User policies
	 */
	filteredAccessRows.sort((a, b) => {
		if (!a.role && !b.role) return 0;
		if (!a.role) return 1;
		if (!b.role) return -1;

		return roles.indexOf(a.role) - roles.indexOf(b.role);
	});

	const ids = filteredAccessRows.map(({ policy }) => policy.id);

	return ids;
}
