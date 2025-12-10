import { withCache, type ProvideFunction } from '@directus/memory';
import type { Accountability } from '@directus/types';
import { toArray } from '@directus/utils';
import type { Knex } from 'knex';
import { useCache } from '../../cache.js';
import emitter from '../../../emitter.js';
import { intersection } from 'lodash-es';

export const fetchPoliciesIpAccess = withCache(
	'policies-ip-access',
	_fetchPoliciesIpAccess,
	useCache(),
	({ user, roles }) => ({
		user,
		roles,
	}),
	(invalidate, [accessIds, policyIds], [{ roles, user }]) => {
		emitter.onAction('directus_access.create', function self({ payload }) {
			// This is not possible for the update cases as the field itself might not be updated
			if (roles.includes(payload['role']) || !user || payload['user'] === user) {
				invalidate();
				emitter.offAction('directus_access.create', self);
			}
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

export async function _fetchPoliciesIpAccess(
	accountability: Pick<Accountability, 'user' | 'roles'>,
	knex: Knex,
	provide: ProvideFunction<string[][]>,
): Promise<string[][]> {
	const query = knex('directus_access')
		.select('id', 'policy', 'directus_policies.ip_access')
		.leftJoin('directus_policies', 'directus_access.policy', 'directus_policies.id')
		.whereNotNull('directus_policies.ip_access');

	// No roles and no user means unauthenticated request
	if (accountability.roles.length === 0 && !accountability.user) {
		query.where({
			role: null,
			user: null,
		});
	} else {
		query.where(function () {
			if (accountability.user) {
				this.orWhere('directus_access.user', accountability.user);
			}

			this.orWhereIn('directus_access.role', accountability.roles);
		});
	}

	const rows = await query;

	const accessIds = rows.map((row) => row.id);
	const policyIds = rows.map((row) => row.policy);

	provide(accessIds, policyIds);

	return rows.filter((row) => row['directus_policies']['ip_access']).map(({ ip_access }) => toArray(ip_access));
}
