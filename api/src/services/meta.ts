import type { Knex } from 'knex';
import getDatabase from '../database/index.js';
import { ForbiddenException } from '../exceptions/index.js';
import type { AbstractServiceOptions } from '../types/index.js';
import type { Accountability, Query, SchemaOverview } from '@directus/shared/types';
import { applyFilter, applySearch } from '../utils/apply-query.js';
import { map } from 'async';
import { fakePromise } from '../utils/fakePromise.js';

export class MetaService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = fakePromise(options.knex || getDatabase());
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}

	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	async getMetaForQuery(collection: string, query: any): Promise<Record<string, any> | undefined> {
		if (!query || !query.meta) return;

		const results = await map(query.meta, async (metaVal: string) => {
			if (metaVal === 'total_count') return this.totalCount(collection);
			if (metaVal === 'filter_count') return this.filterCount(collection, query);
			return undefined;
		})

		return results.reduce((metaObject: Record<string, any>, value, index) => {
			return {
				...metaObject,
				[query.meta![index]]: value,
			};
		}, {});
	}

	async totalCount(collection: string): Promise<number> {
		const dbQuery = fakePromise(this.knex(collection).count('*', { as: 'count' }).first());

		if (this.accountability?.admin !== true) {
			const permissionsRecord = this.accountability?.permissions?.find((permission) => {
				return permission.action === 'read' && permission.collection === collection;
			});

			if (!permissionsRecord) throw new ForbiddenException();

			const permissions = permissionsRecord.permissions ?? {};

			await applyFilter(this.knex, this.schema, dbQuery, permissions, collection);
		}

		const result = await dbQuery.removeFakePromise();

		return Number(result?.count ?? 0);
	}

	async filterCount(collection: string, query: Query): Promise<number> {
		const dbQuery = fakePromise(this.knex(collection).count('*', { as: 'count' }));

		let filter = query.filter || {};

		if (this.accountability?.admin !== true) {
			const permissionsRecord = this.accountability?.permissions?.find((permission) => {
				return permission.action === 'read' && permission.collection === collection;
			});

			if (!permissionsRecord) throw new ForbiddenException();

			const permissions = permissionsRecord.permissions ?? {};

			if (Object.keys(filter).length > 0) {
				filter = { _and: [permissions, filter] };
			} else {
				filter = permissions;
			}
		}

		if (Object.keys(filter).length > 0) {
			await applyFilter(this.knex, this.schema, dbQuery, filter, collection);
		}


		if (query.search) {
			await applySearch(this.schema, dbQuery, query.search, collection);
		}

		const records = await dbQuery.removeFakePromise();

		return Number(records[0]!.count);
	}
}
