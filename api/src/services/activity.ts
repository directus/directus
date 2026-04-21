import type { AbstractServiceOptions, Query, QueryOptions } from '@directus/types';
import { createHistoryQueryResolver } from '../utils/get-history-filter-query.js';
import { ItemsService } from './items.js';

export class ActivityService extends ItemsService {
	private readonly resolveHistoryQuery = createHistoryQueryResolver('activity_history_days', (sinceDate) => ({
		timestamp: {
			_gte: sinceDate.toISOString(),
		},
	}));

	constructor(options: AbstractServiceOptions) {
		super('directus_activity', options);
	}

	async getHistoryQuery(query: Query): Promise<Query> {
		return this.resolveHistoryQuery(query, this.knex);
	}

	override async readByQuery(query: Query, opts?: QueryOptions) {
		const historyQuery = await this.getHistoryQuery(query);

		return super.readByQuery(historyQuery, opts);
	}
}
