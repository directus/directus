import type { PassiveLimitEntitlementKey } from '@directus/license';
import type { Filter, Query } from '@directus/types';
import { mergeFilters } from '@directus/utils';
import { getEntitlementManager } from '../license/index.js';

export type HistoryFilterBuilder = (sinceDate: Date) => Filter;

export function getHistoryFilterQuery(
	query: Query,
	entitlement: PassiveLimitEntitlementKey,
	buildFilter: HistoryFilterBuilder,
): Query {
	const entitlementManager = getEntitlementManager();
	const limit = entitlementManager.getEntitlementLimit(entitlement);

	if (limit === null || !Number.isFinite(limit) || limit < 0) {
		return query;
	}

	if (limit === 0) {
		return { ...query, limit: 0 };
	}

	const sinceDate = new Date(Date.now() - limit * 1000);
	const filter = mergeFilters(buildFilter(sinceDate), query.filter ?? null, 'and');

	if (!filter) {
		return query;
	}

	return { ...query, filter };
}
