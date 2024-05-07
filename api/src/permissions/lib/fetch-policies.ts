import type { Accountability, Filter } from '@directus/types';
import type { AccessService } from '../../services/access.js';
import type { AccessRow } from '../modules/process-ast/types.js';
import { filterPoliciesByIp } from '../utils/filter-policies-by-ip.js';
import { withCache } from '../utils/with-cache.js';

export const fetchPolicies = withCache('policies', _fetchPolicies);

/**
 * Fetch the policies associated with the current user accountability
 */
export async function _fetchPolicies(
	{ roles, user, ip }: Pick<Accountability, 'user' | 'roles' | 'ip'>,
	accessService: AccessService,
): Promise<string[]> {
	let filter: Filter = {};

	// No roles and no user means unauthenticated request
	if (roles.length === 0 && !user) {
		filter = { role: { _null: true }, user: { _null: true } };
	} else {
		const roleFilter = { role: { _in: roles } };
		filter = user ? { _or: [{ user: { _eq: user } }, roleFilter] } : roleFilter;
	}

	const accessRows = (await accessService.readByQuery({
		filter,
		fields: ['policy.id', 'policy.ip_access'],
		limit: -1,
	})) as AccessRow[];

	const filteredAccessRows = filterPoliciesByIp(accessRows, ip);
	const ids = filteredAccessRows.map(({ policy }) => policy.id);

	return ids;
}

export function getCacheKey(roles: string[], user: string | null, ip: string | null | undefined) {
	let key = `fp-${roles.join('_')}`;

	if (user) {
		key += '-' + user;
	}

	if (ip) {
		key += '-' + ip;
	}

	return key;
}
