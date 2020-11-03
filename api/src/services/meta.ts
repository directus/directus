import { Query } from '../types/query';
import database from '../database';
import { AbstractServiceOptions, Accountability } from '../types';
import Knex from 'knex';
import { applyFilter } from '../utils/apply-query';

export class MetaService {
	knex: Knex;
	accountability: Accountability | null;

	constructor(options?: AbstractServiceOptions) {
		this.knex = options?.knex || database;
		this.accountability = options?.accountability || null;
	}

	async getMetaForQuery(collection: string, query: Query) {
		if (!query || !query.meta) return;

		const results = await Promise.all(
			query.meta.map((metaVal) => {
				if (metaVal === 'total_count') return this.totalCount(collection);
				if (metaVal === 'filter_count') return this.filterCount(collection, query);
			})
		);

		return results.reduce((metaObject: Record<string, any>, value, index) => {
			return {
				...metaObject,
				[query.meta![index]]: value,
			};
		}, {});
	}

	async totalCount(collection: string) {
		const records = await this.knex(collection).count('*', { as: 'count' });
		return Number(records[0].count);
	}

	async filterCount(collection: string, query: Query) {
		const dbQuery = this.knex(collection).count('*', { as: 'count' });

		if (query.filter) {
			await applyFilter(this.knex, dbQuery, query.filter, collection);
		}

		const records = await dbQuery;

		return Number(records[0].count);
	}
}
