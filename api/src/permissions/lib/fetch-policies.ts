import type { Accountability, Filter } from '@directus/types';
import type { Context } from '../types.js';
import { filterPoliciesByIp } from '../utils/filter-policies-by-ip.js';
import emitter from '../../emitter.js';
import { intersection } from 'lodash-es';
import { withCache, type ProvideFunction } from '@directus/memory';
import { useCache } from '../cache.js';

export interface AccessRow {
	id: string;
	policy: { id: string; ip_access: string[] | null };
	role: string | null;
}

export const fetchPolicies = withCache(
	'policies',
	_fetchPolicies,
	useCache(),
	({ roles, user, ip }) => ({ roles, user, ip }),
	(invalidate, [accessIds, policyIds]) => {
		emitter.onAction('directus_access.create', function self() {
			invalidate();
			emitter.offAction('directus_access.create', self);
		});

		emitter.onAction('directus_access.update', function self({ keys }) {
			if (intersection(accessIds, keys).length > 0) {
				invalidate();
				emitter.offAction('directus_access.update', self);
			}
		});

		emitter.onAction('directus_policies.update', function self({ keys }) {
			if (intersection(policyIds, keys).length > 0) {
				invalidate();
				emitter.offAction('directus_policies.update', self);
			}
		});

		emitter.onAction('directus_access.delete', function self({ keys }) {
			if (intersection(accessIds, keys).length > 0) {
				invalidate();
				emitter.offAction('directus_access.delete', self);
			}
		});

		emitter.onAction('directus_policies.delete', function self({ keys }) {
			if (intersection(policyIds, keys).length > 0) {
				invalidate();
				emitter.offAction('directus_policies.delete', self);
			}
		});
	},
);

/**
 * Fetch the policies associated with the current user accountability
 */
export async function _fetchPolicies(
	{ roles, user, ip }: Pick<Accountability, 'user' | 'roles' | 'ip'>,
	context: Context,
	provide: ProvideFunction<[string[], string[]]>,
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
		fields: ['id', 'policy.id', 'policy.ip_access', 'role'],
		limit: -1,
	})) as AccessRow[];

	const accessIds = accessRows.map((row) => row.id);
	const policyIds = accessRows.map((row) => row.policy.id);

	provide(accessIds, policyIds);

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
