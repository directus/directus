import type { Accountability, Filter } from '@directus/types';
import type { AccessService } from '../../services/access.js';
import type { AccessRow } from '../modules/process-ast/types.js';
import { filterPoliciesByIp } from '../utils/filter-policies-by-ip.js';

/**
 * Fetch the policies associated with the current user accountability
 */
export async function fetchPolicies(
	accessService: AccessService,
	{ user, roles, ip }: Pick<Accountability, 'user' | 'roles' | 'ip'>,
): Promise<string[]> {
	// TODO add cache

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

	return filteredAccessRows.map(({ policy }) => policy.id);
}
