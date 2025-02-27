import type { Accountability, Query, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { isArray } from 'lodash-es';
import { getAstFromQuery } from '../database/get-ast-from-query/get-ast-from-query.js';
import getDatabase from '../database/index.js';
import { runAst } from '../database/run-ast/run-ast.js';
import { processAst } from '../permissions/modules/process-ast/process-ast.js';
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
		const aggregateQuery: Query = {
			aggregate: {
				count: ['*'],
			},
			search: query.search ?? null,
			filter: query.filter ?? null,
		};

		let ast = await getAstFromQuery(
			{
				collection,
				query: aggregateQuery,
				accountability: this.accountability,
			},
			{
				schema: this.schema,
				knex: this.knex,
			},
		);

		ast = await processAst(
			{ ast, action: 'read', accountability: this.accountability },
			{ knex: this.knex, schema: this.schema },
		);

		const records = await runAst(ast, this.schema, this.accountability, {
			knex: this.knex,
		});

		return Number((isArray(records) ? records[0]?.['count'] : records?.['count']) ?? 0);
	}
}
