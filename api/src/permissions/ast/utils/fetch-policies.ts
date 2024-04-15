import type { AccessService } from '../../../services/access.js';
import type { AccessRow } from '../types.js';

/**
 * Fetch the policies associated with the current request.
 *
 * If the public flag is set, it will ignore the passed roles and users and exclusively fetch the
 * policies associated to the public role.
 *
 * If the public flag is false, it'll use the passed list of roles and the optionally passed user ID
 * to fetch all policies for the current user / role combination.
 *
 * These policies *are not* in any particular order.
 */
export async function fetchPolicies(
	accessService: AccessService,
	isPublic: boolean,
	roles: string[],
	user: string | null | undefined,
) {
	// If the current accountability indicates that the request is made using the public role, we can
	// ignore the user policies (as there's no users in the "public" role)
	if (isPublic) {
		return (await accessService.readByQuery({
			fields: ['policy.id', 'policy.admin_access', 'policy.ip_access', 'sort', 'role'],
			sort: ['sort'],
			filter: { role: { _null: true } },
		})) as AccessRow[];
	}

	const roleFilter = { role: { _in: roles } };

	const filter = user ? { _or: [{ user: { _eq: user } }, roleFilter] } : roleFilter;

	return (await accessService.readByQuery({
		fields: ['policy', 'sort', 'role'],
		sort: ['role', 'sort'],
		filter,
	})) as AccessRow[];
}
