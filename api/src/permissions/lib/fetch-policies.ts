import type { Context } from '../types.js';
import { filterPoliciesByIp } from '../utils/filter-policies-by-ip.js';
import { withCache } from '../utils/with-cache.js';
import type { Accountability, Filter } from '@directus/types';

export interface AccessRow {
	policy: { id: string; ip_access: string[] | null };
	role: string | null;
}

export const fetchPolicies = withCache('policies', _fetchPolicies, ({ roles, user, ip }) => ({ roles, user, ip }));

/**
 * Fetch the policies associated with the current user accountability
 */
export async function _fetchPolicies(
	{ roles, user, ip }: Pick<Accountability, 'user' | 'roles' | 'ip'>,
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

	const filteredAccessRows = filterPoliciesByIp(accessRows, ip);

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
