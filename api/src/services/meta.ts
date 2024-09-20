import type { Accountability, Filter, Permission, Query, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import getDatabase from '../database/index.js';
import { fetchPermissions } from '../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../permissions/lib/fetch-policies.js';
import { dedupeAccess } from '../permissions/modules/process-ast/utils/dedupe-access.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
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
		const dbQuery = this.knex(collection);

		let hasJoins = false;

		if (this.accountability && this.accountability.admin === false) {
			const context = { knex: this.knex, schema: this.schema };

			await validateAccess(
				{
					accountability: this.accountability,
					action: 'read',
					collection,
				},
				context,
			);

			const policies = await fetchPolicies(this.accountability, context);

			const permissions = await fetchPermissions(
				{
					action: 'read',
					policies,
					accountability: this.accountability,
				},
				context,
			);

			const collectionPermissions = permissions.filter((permission) => permission.collection === collection);

			const rules = dedupeAccess(collectionPermissions);
			const cases = rules.map(({ rule }) => rule);

			const filter = {
				_or: cases,
			};

			const result = applyFilter(this.knex, this.schema, dbQuery, filter, collection, {}, cases, permissions);
			hasJoins = result.hasJoins;
		}

		if (hasJoins) {
			const primaryKeyName = this.schema.collections[collection]!.primary;

			dbQuery.countDistinct({ count: [`${collection}.${primaryKeyName}`] });
		} else {
			dbQuery.count('*', { as: 'count' });
		}

		const result = await dbQuery.first();

		return Number(result?.count ?? 0);
	}

	async filterCount(collection: string, query: Query): Promise<number> {
		const dbQuery = this.knex(collection);

		let filter = query.filter || {};
		let hasJoins = false;
		let cases: Filter[] = [];
		let permissions: Permission[] = [];

		if (this.accountability && this.accountability.admin === false) {
			const context = { knex: this.knex, schema: this.schema };

			await validateAccess(
				{
					accountability: this.accountability,
					action: 'read',
					collection,
				},
				context,
			);

			const policies = await fetchPolicies(this.accountability, context);

			permissions = await fetchPermissions(
				{
					action: 'read',
					policies,
					accountability: this.accountability,
				},
				context,
			);

			const collectionPermissions = permissions.filter((permission) => permission.collection === collection);

			const rules = dedupeAccess(collectionPermissions);
			cases = rules.map(({ rule }) => rule);

			const permissionsFilter = {
				_or: cases,
			};

			if (Object.keys(filter).length > 0) {
				filter = { _and: [permissionsFilter, filter] };
			} else {
				filter = permissionsFilter;
			}
		}

		if (Object.keys(filter).length > 0) {
			({ hasJoins } = applyFilter(this.knex, this.schema, dbQuery, filter, collection, {}, cases, permissions));
		}

		if (query.search) {
			applySearch(this.knex, this.schema, dbQuery, query.search, collection);
		}

		if (hasJoins) {
			const primaryKeyName = this.schema.collections[collection]!.primary;

			dbQuery.countDistinct({ count: [`${collection}.${primaryKeyName}`] });
		} else {
			dbQuery.count('*', { as: 'count' });
		}

		const result = await dbQuery.first();

		return Number(result?.count ?? 0);
	}
}
