import { Knex } from 'knex';
import { JsonFieldNode } from '../../../../types';
import { JsonHelperDefault } from './default';
import { getOperation } from '../../../../utils/apply-query';
import { applyJsonFilterQuery } from '../filters';
import { Item } from '@directus/shared/types';
import { generateAlias } from '../../../../utils/generate-alias';

/**
 * JSON support for SQLite 3.38+
 */
export class JsonHelperSQLite extends JsonHelperDefault {
	preProcess(dbQuery: Knex.QueryBuilder, table: string): void {
		// without wildcards the data can be directly extracted
		const selectQueries = this.nodes.filter(
			({ jsonPath, query }) =>
				jsonPath.indexOf('[*]') === -1 && jsonPath.indexOf('.*') === -1 && Object.keys(query).length === 0
		);
		// with wildcards a join/subquery structure is required
		const joinQueries = this.nodes.filter(
			({ jsonPath, query }) =>
				jsonPath.indexOf('[*]') > 0 || jsonPath.indexOf('.*') > 0 || Object.keys(query).length > 0
		);

		if (joinQueries.length > 0) {
			for (const node of joinQueries) {
				this.buildWithJson(dbQuery, node, table);
			}
		}
		if (selectQueries.length > 0) {
			// these are simple enough to make use of the knex jsonExtract abstraction
			// https://knexjs.org/guide/query-builder.html#jsonextract
			dbQuery.select(
				selectQueries.map((node) => {
					return this.knex.raw(this.knex.jsonExtract(`${table}.${node.name}`, node.jsonPath, node.fieldKey, false));
				})
			);
		}
		dbQuery.from(table);
	}
	postProcess(items: Item[]): void {
		// make sure any json is returned as the correct type instead of a string
		this.postProcessParseJSON(items);
	}
	private buildWithJson(dbQuery: Knex.QueryBuilder, node: JsonFieldNode, table: string): Knex.QueryBuilder {
		// building this subquery makes use of the `json_each(...)` function to create a temporary table structure
		// against which can be queried https://www.sqlite.org/json1.html#jeach
		const { jsonPath, name } = node;
		// split up the provided query into each stage
		const arrayParts = jsonPath
			.split('[*]')
			.flatMap((p) => p.split('.*'))
			.map((q) => (q.startsWith('$') ? q : '$' + q));
		const aliases = arrayParts.map(() => generateAlias()),
			withAlias = generateAlias();
		if (arrayParts.length > 1 && arrayParts[arrayParts.length - 1] === '$') {
			arrayParts.pop();
		}
		const primaryKey = this.schema.collections[table].primary;
		const fromList = [
			this.knex.raw('??', [table]),
			this.knex.raw('json_each(??.??, ?) as ??', [table, name, arrayParts[0], aliases[0]]),
		];
		// build up a nested `json_each()` table depending on the depth required
		const subQuery = this.knex.select(`${table}.${primaryKey}`);
		for (let i = 1; i < arrayParts.length - 1; i++) {
			fromList.push(this.knex.raw('json_each(??.value, ?) as ??', [aliases[i - 1], arrayParts[i], aliases[i]]));
		}
		const conditions = [];
		if (node.query?.filter) {
			for (const [jsonPath, value] of Object.entries(node.query?.filter)) {
				let alias = aliases[0];
				if (arrayParts.length > 1) {
					// extract temporary values to filter against
					fromList.push(
						this.knex.raw('json_each(??.value, ?) as ??', [
							aliases[aliases.length - 2],
							arrayParts[arrayParts.length - 1],
							alias,
						])
					);
					alias = generateAlias();
				}
				subQuery.select(this.knex.raw('json_group_array(??.value) as ??', [alias, aliases[aliases.length - 1]]));
				const { operator: filterOperator, value: filterValue } = getOperation(jsonPath, value);
				const alias2 = generateAlias();
				subQuery.select(this.knex.raw('json_extract(??.value, ?) as ??', [alias, jsonPath, alias2]));
				conditions.push({ alias: alias2, operator: filterOperator, value: filterValue });
			}
		} else {
			subQuery.select(this.buildJsonGroupArray(arrayParts, aliases));
		}
		subQuery.fromRaw(this.knex.raw(fromList.map((f) => f.toQuery()).join(',')));
		for (const { alias, operator, value } of conditions) {
			// apply SQL filters to the temporary tables
			applyJsonFilterQuery(subQuery, alias, operator, value, 'and');
		}
		// group the temporary tables to get a single value
		subQuery.groupBy(`${table}.${primaryKey}`);
		const selectJsonField = node.query?.filter
			? this.knex.raw("COALESCE(??.??, '[]') as ??", [withAlias, aliases[aliases.length - 1], node.fieldKey])
			: this.knex.raw('??.?? as ??', [withAlias, aliases[aliases.length - 1], node.fieldKey]);

		dbQuery
			.with(withAlias, subQuery)
			.select(selectJsonField)
			.leftJoin(withAlias, `${table}.${primaryKey}`, '=', `${withAlias}.${primaryKey}`);
		return dbQuery;
	}
	private buildJsonGroupArray(queryParts: string[], aliases: string[]): Knex.Raw {
		const currentAlias = aliases[aliases.length - 1];
		const prevAlias = aliases[aliases.length - 2];
		const currentQuery = queryParts[queryParts.length - 1];
		if (currentQuery === '$') {
			return this.knex.raw('json_group_array(??.value) as ??', [prevAlias, currentAlias]);
		}
		return this.knex.raw('json_group_array(json_extract(??.??, ?)) as ??', [
			prevAlias,
			'value',
			currentQuery,
			currentAlias,
		]);
	}
	filterQuery(collection: string, node: JsonFieldNode): Knex.Raw {
		// uses the native `json_extract(...)` function for regular filtering
		// https://www.sqlite.org/json1.html#jex
		return this.knex.raw(`json_extract(??.??, ?)`, [collection, node.name, node.jsonPath]);
	}
}
