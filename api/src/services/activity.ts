import type { AbstractServiceOptions, Query, QueryOptions } from '@directus/types';
import { getHistoryFilterQuery } from '../utils/get-history-filter-query.js';
import { ItemsService } from './items.js';

export class ActivityService extends ItemsService {
	private queryCache = new WeakMap<Query, Query>();

	constructor(options: AbstractServiceOptions) {
		super('directus_activity', options);
	}

	override async readByQuery(query: Query, opts?: QueryOptions) {
		if (this.accountability === null) {
			return super.readByQuery(query, opts);
		}

		const historyQuery = this.getLimitedHistoryQuery(query);

		return super.readByQuery(historyQuery, opts);
	}

	getLimitedHistoryQuery(query: Query) {
		let cachedQuery = this.queryCache.get(query);

		if (!cachedQuery) {
			cachedQuery = getHistoryFilterQuery(query, 'activity_historical_timeframe', (sinceDate) => ({
				timestamp: {
					_gte: sinceDate.toISOString(),
				},
			}));

			this.queryCache.set(query, cachedQuery);
		}

		return cachedQuery;
	}
}
