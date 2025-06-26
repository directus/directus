import type { Accountability, Permission, Query, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { isArray } from 'lodash-es';
import getDatabase from '../database/index.js';
import applyQuery from '../database/run-ast/lib/apply-query/index.js';
import { fetchPermissions } from '../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../permissions/lib/fetch-policies.js';
import { getCases } from '../permissions/modules/process-ast/lib/get-cases.js';
import type { AbstractServiceOptions } from '../types/index.js';

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
		return this.filterCount(collection, {});
	}

	async filterCount(collection: string, query: Query): Promise<number> {
		let permissions: Permission[] = [];

		if (this.accountability && !this.accountability.admin) {
			const policies = await fetchPolicies(this.accountability, { schema: this.schema, knex: this.knex });

			permissions = await fetchPermissions(
				{ action: 'read', accountability: this.accountability, policies },
				{ schema: this.schema, knex: this.knex },
			);
		}

		const { cases } = getCases(collection, permissions, []);

		const { query: dbQuery, hasJoins } = applyQuery(
			this.knex,
			collection,
			this.knex(collection),
			{
				filter: query.filter ?? null,
				search: query.search ?? null,
			},
			this.schema,
			cases,
			permissions,
		);

		if (hasJoins) {
			dbQuery.countDistinct({ count: [`${collection}.${this.schema.collections[collection]!.primary}`] });
		} else {
			dbQuery.count('*', { as: 'count' });
		}

		const records = await dbQuery;

		return Number((isArray(records) ? records[0]?.['count'] : records?.['count']) ?? 0);
	}
}
