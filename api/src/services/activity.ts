import type { AbstractServiceOptions, Query, QueryOptions } from '@directus/types';
import { getHistoryFilterQuery } from '../utils/get-history-filter-query.js';
import { ItemsService } from './items.js';

export class ActivityService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_activity', options);
	}

	override async readByQuery(query: Query, opts?: QueryOptions) {
		if (this.accountability === null) {
			return super.readByQuery(query, opts);
		}

		const historyQuery = getHistoryFilterQuery(query, 'revision_historical_timeframe', (sinceDate) => ({
			timestamp: {
				_gte: sinceDate.toISOString(),
			},
		}));

		return super.readByQuery(historyQuery, opts);
	}
}
