import { withCache } from '@directus/memory';
import type { Accountability, GlobalAccess } from '@directus/types';
import {
	fetchGlobalAccessForRoles as _fetchGlobalAccessForRoles,
	fetchGlobalAccessForUser as _fetchGlobalAccessForUser,
} from '@directus/utils/node';
import type { Knex } from 'knex';
import { useCache } from '../../cache.js';
import emitter from '../../../emitter.js';

interface FetchGlobalAccessContext {
	knex: Knex;
	ip?: Accountability['ip'];
}

// Doesn't need invalidation as the function itself doesn't fetch any data directly.
// The inner cached functions will handle invalidation.
export const fetchGlobalAccess = withCache(
	'global-access',
	_fetchGlobalAccess,
	useCache(),
	({ user, roles }, { ip }) => ({
		user,
		roles,
		ip,
	}),
);

const fetchGlobalAccessForRoles = withCache(
	'global-access-roles',
	_fetchGlobalAccessForRoles,
	useCache(),
	(roles, { ip }) => ({
		roles,
		ip,
	}),
	(invalidate, _, [roles]) => {
		emitter.onAction('directus_access.create', function self({ payload }) {
			// This is not possible for the update cases as the field itself might not be updated
			if (roles.includes(payload['role'])) {
				invalidate();
				emitter.offAction('directus_access.create', self);
			}
		});

		emitter.onAction('directus_access.update', function self() {
			// Could be optimized to only invalidate if the updated ids match the fetched access ids
			invalidate();
			emitter.offAction('directus_access.update', self);
		});

		emitter.onAction('directus_policies.update', function self() {
			// Could be optimized to only invalidate if the updated ids match the fetched policy ids
			invalidate();
			emitter.offAction('directus_policies.update', self);
		});

		emitter.onAction('directus_access.delete', function self() {
			// Could be optimized to only invalidate if the deleted ids match the fetched access ids
			invalidate();
			emitter.offAction('directus_access.delete', self);
		});

		emitter.onAction('directus_policies.delete', function self() {
			// Could be optimized to only invalidate if the updated ids match the fetched policy ids
			invalidate();
			emitter.offAction('directus_policies.delete', self);
		});
	},
);

const fetchGlobalAccessForUser = withCache(
	'global-access-user',
	_fetchGlobalAccessForUser,
	useCache(),
	(user, { ip }) => ({
		user,
		ip,
	}),
	(invalidate, _, [user]) => {
		emitter.onAction('directus_access.create', function self({ payload }) {
			// This is not possible for the update cases as the field itself might not be updated
			if (!user || payload['user'] === user) {
				invalidate();
				emitter.offAction('directus_access.create', self);
			}
		});

		emitter.onAction('directus_access.update', function self() {
			// Could be optimized to only invalidate if the updated ids match the fetched access ids
			invalidate();
			emitter.offAction('directus_access.update', self);
		});

		emitter.onAction('directus_policies.update', function self() {
			// Could be optimized to only invalidate if the updated ids match the fetched policy ids
			invalidate();
			emitter.offAction('directus_policies.update', self);
		});

		emitter.onAction('directus_access.delete', function self() {
			// Could be optimized to only invalidate if the deleted ids match the fetched access ids
			invalidate();
			emitter.offAction('directus_access.delete', self);
		});

		emitter.onAction('directus_policies.delete', function self() {
			// Could be optimized to only invalidate if the updated ids match the fetched policy ids
			invalidate();
			emitter.offAction('directus_policies.delete', self);
		});
	},
);

/**
 * Re-implements fetchGlobalAccess to add caching, fetches roles and user info separately so they can be cached and reused individually
 */
export async function _fetchGlobalAccess(
	accountability: Pick<Accountability, 'user' | 'roles' | 'ip'>,
	context: FetchGlobalAccessContext,
): Promise<GlobalAccess> {
	const access = await fetchGlobalAccessForRoles(accountability.roles, { knex: context.knex, ip: accountability.ip });

	if (accountability.user !== undefined) {
		const userAccess = await fetchGlobalAccessForUser(accountability.user, {
			knex: context.knex,
			ip: accountability.ip,
		});

		// If app/admin is already true, keep it true
		access.app ||= userAccess.app;
		access.admin ||= userAccess.admin;
	}

	return access;
}
