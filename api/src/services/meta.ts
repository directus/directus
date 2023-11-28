import type { Accountability, Query, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import getDatabase from '../database/index.js';
import { ForbiddenError } from '@directus/errors';
import type { AbstractServiceOptions } from '../types/index.js';
import { applyFilter, applySearch } from '../utils/apply-query.js';

export class MetaService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}

	async getMetaForQuery(collection: string, query: any): Promise<Record<string, any> | undefined> {
		if (!query || !query.meta) return;

		const results = await Promise.all(
			query.meta.map((metaVal: string) => {
				if (metaVal === 'total_count') return this.totalCount(collection);
				if (metaVal === 'filter_count') return this.filterCount(collection, query);
				return undefined;
			}),
		);

		return results.reduce((metaObject: Record<string, any>, value, index) => {
			return {
				...metaObject,
				[query.meta![index]]: value,
			};
		}, {});
	}

	async totalCount(collection: string): Promise<number> {
		const dbQuery = this.knex(collection).count('*', { as: 'count' }).first();

		if (this.accountability?.admin !== true) {
			const permissionsRecord = this.accountability?.permissions?.find((permission) => {
				return permission.action === 'read' && permission.collection === collection;
			});

			if (!permissionsRecord) throw new ForbiddenError();

			const permissions = permissionsRecord.permissions ?? {};

			applyFilter(this.knex, this.schema, dbQuery, permissions, collection, {});
		}

		const result = await dbQuery;

		return Number(result?.count ?? 0);
	}

	async filterCount(collection: string, query: Query): Promise<number> {
		const dbQuery = this.knex(collection);

		let filter = query.filter || {};
		let hasJoins = false;

		if (this.accountability?.admin !== true) {
			const permissionsRecord = this.accountability?.permissions?.find((permission) => {
				return permission.action === 'read' && permission.collection === collection;
			});

			if (!permissionsRecord) throw new ForbiddenError();

			const permissions = permissionsRecord.permissions ?? {};

			if (Object.keys(filter).length > 0) {
				filter = { _and: [permissions, filter] };
			} else {
				filter = permissions;
			}
		}

		if (Object.keys(filter).length > 0) {
			({ hasJoins } = applyFilter(this.knex, this.schema, dbQuery, filter, collection, {}));
		}

		if (query.search) {
			applySearch(this.schema, dbQuery, query.search, collection);
		}

		if (hasJoins) {
			const primaryKeyName = this.schema.collections[collection]!.primary;

			dbQuery.countDistinct({ count: [`${collection}.${primaryKeyName}`] });
		} else {
			dbQuery.count('*', { as: 'count' });
		}

		const records = await dbQuery;

		return Number(records[0]!['count']);
	}
}
