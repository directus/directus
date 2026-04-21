import type { Filter, Query } from '@directus/types';
import { mergeFilters } from '@directus/utils';
import type { Knex } from 'knex';
import { getLicenseEntitlements } from '../license/summary.js';

type HistoryEntitlement = 'activity_history_days' | 'revisions_history_days';

type HistoryFilterBuilder = (sinceDate: Date) => Filter;

const denyHistoryFilter: Filter = {
	id: {
		_null: true,
	},
};

export function createHistoryQueryResolver(entitlement: HistoryEntitlement, buildFilter: HistoryFilterBuilder) {
	const cache = new WeakMap<Query, Promise<Query>>();

	return (query: Query, knex: Knex | undefined): Promise<Query> => {
		const cachedQuery = cache.get(query);

		if (cachedQuery) return cachedQuery;

		const historyQuery = getHistoryFilterQuery(query, entitlement, knex, buildFilter);
		cache.set(query, historyQuery);
		return historyQuery;
	};
}

export async function getHistoryFilterQuery(
	query: Query,
	entitlement: HistoryEntitlement,
	knex: Knex | undefined,
	buildFilter: HistoryFilterBuilder,
): Promise<Query> {
	const entitlements = await getLicenseEntitlements(knex);
	const limit = entitlements[entitlement]?.limit;

	if (limit === null) {
		return query;
	}

	if (typeof limit !== 'number' || !Number.isFinite(limit) || limit < 0) {
		return query;
	}

	if (limit === 0) {
		return {
			...query,
			filter: mergeFilters(denyHistoryFilter, query.filter ?? null, 'and') ?? denyHistoryFilter,
		};
	}

	const sinceDate = new Date(Date.now() - limit * 24 * 60 * 60 * 1000);
	const filter = mergeFilters(buildFilter(sinceDate), query.filter ?? null, 'and');

	if (!filter) {
		return query;
	}

	return {
		...query,
		filter,
	};
}
