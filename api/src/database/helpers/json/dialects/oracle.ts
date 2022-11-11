import { Knex } from 'knex';
import logger from '../../../../logger';
import { JsonFieldNode } from '../../../../types';
import { JsonHelperDefault } from './default';
import { customAlphabet } from 'nanoid';
import { getOperation } from '../../../../utils/apply-query';
import { applyJsonFilterQuery } from '../filters';
import { Item } from '@directus/shared/types';

// ORACLE PREFERS SCREAMING CAPITALS
const generateAlias = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 5);

/**
 * To support first-level array queries consistently we will need to get to a query like:

with XYZ as (
	select "jason"."id", json_arrayagg(COALESCE("j"."SCAL", "j"."OBJ") FORMAT JSON) as "res"
	from "jason", json_table("jason"."data", '$[*]' COLUMNS (obj FORMAT JSON PATH '$.a', scal PATH '$.a')) as "j"
	group by "jason"."id"
)
select "jason".*, "XYZ"."res"
from "jason", "XYZ"
where "XYZ"."id" = "jason"."id"
 */
/**
 * To support nested array queries consistently the above needs to be extended to:

with "XYZ" as (
	select "o"."id" as "id", json_arrayagg("j"."SCAL") as "res"
	from "jason" "o", json_table("o"."data", '$[*]' COLUMNS (NESTED PATH '$.a[*]' COLUMNS ( obj FORMAT JSON PATH '$.b', scal varchar(4000) PATH '$.b' ))) as "j"
	group by "o"."id"
)
select "jason".*, "XYZ"."res"
from "jason", "XYZ"
where "XYZ"."id" = "jason"."id"
 */
export class JsonHelperOracle extends JsonHelperDefault {
	static isSupported({ parsed }: { parsed: number[]; full: string }): boolean {
		if (parsed.length === 0) return false;
		const [major] = parsed;
		// json support added in version 12c
		// https://docs.oracle.com/en/database/oracle/oracle-database/12.2/adjsn/function-JSON_QUERY.html#GUID-D64C7BE9-335D-449C-916D-1123539BF1FB
		return major > 12;
	}
	preProcess(dbQuery: Knex.QueryBuilder, table: string): void {
		const selectQueries = this.nodes.filter(
			({ jsonPath, query }) =>
				jsonPath.indexOf('[*]') === -1 && jsonPath.indexOf('.*') === -1 && Object.keys(query).length === 0
		);
		const joinQueries = this.nodes.filter(
			({ jsonPath, query }) =>
				jsonPath.indexOf('[*]') > 0 || jsonPath.indexOf('.*') > 0 || Object.keys(query).length > 0
		);

		if (joinQueries.length > 0) {
			const aliases = [];
			for (const node of joinQueries) {
				const alias = generateAlias();
				this.buildWithJson(dbQuery, node, table, alias);
				aliases.push(alias);
			}
			dbQuery.fromRaw([table, ...aliases].map((alias) => this.knex.raw('??', [alias]).toQuery()).join(','));
			const primaryKey = this.schema.collections[table].primary;
			for (const alias of aliases) {
				dbQuery.whereRaw('??.?? = ??.??', [table, primaryKey, alias, primaryKey]);
			}
			logger.info(dbQuery.toQuery());
		}
		if (selectQueries.length > 0) {
			dbQuery.select(
				this.nodes.map((node) => {
					const query = this.knex.raw('?', [node.jsonPath]).toQuery();
					return this.knex.raw(`COALESCE(json_query(??.??, ${query}),json_value(??.??, ${query})) as ??`, [
						table,
						node.name,
						table,
						node.name,
						node.fieldKey,
					]);
				})
			);
		}
	}
	postProcess(items: Item[]): void {
		this.postProcessParseJSON(items);
	}
	private buildWithJson(
		dbQuery: Knex.QueryBuilder,
		node: JsonFieldNode,
		table: string,
		alias: string
	): Knex.QueryBuilder {
		const { jsonPath, name } = node;
		const queryParts = this.splitQuery(jsonPath);
		const primaryKey = this.schema.collections[table].primary;
		logger.info(queryParts);

		const { table: joinTable, field: jsonField, alias: jsonAlias } = this.buildJsonTable(table, name, queryParts);

		const selectList = [this.knex.raw('??.?? as ??', [table, primaryKey, primaryKey]), jsonField];

		const fromList = [this.knex.raw('??', [table]), joinTable];

		const subQuery = this.applyFilter(
			this.knex.select(selectList).fromRaw(this.knex.raw(fromList.map((f) => f.toQuery()).join(','))),
			node,
			table,
			name
		).groupBy(this.knex.raw('??.??', [table, primaryKey]));

		dbQuery = dbQuery.with(alias, subQuery).select(this.knex.raw('??.?? as ??', [alias, jsonAlias, node.fieldKey]));

		return dbQuery;
	}
	private buildJsonTable(
		table: string,
		column: string,
		parts: string[]
	): { table: Knex.Raw; field: Knex.Raw; alias: string } {
		const rootPath = this.knex.raw('?', [parts[0]]).toQuery(),
			tableAlias = generateAlias(),
			fieldAlias = generateAlias();
		if (parts.length > 2) {
			let nestedColumns = '';
			for (let i = 1; i < parts.length - 1; i++) {
				const fieldPath = this.knex.raw('?', [parts[i]]).toQuery();
				nestedColumns += `NESTED PATH ${fieldPath} COLUMNS (`;
			}
			const fieldPair = [generateAlias(), generateAlias()];
			const fieldPath = this.knex.raw('?', [parts[parts.length - 1]]).toQuery();
			nestedColumns += this.knex.raw(`?? PATH ${fieldPath}, ?? FORMAT JSON PATH ${fieldPath})`, fieldPair).toQuery();
			for (let i = 1; i < parts.length - 1; i++) {
				nestedColumns += ')';
			}
			return {
				table: this.knex.raw(`json_table(??.??, ${rootPath} COLUMNS (${nestedColumns}) as ??`, [
					table,
					column,
					tableAlias,
				]),
				alias: fieldAlias,
				field: this.knex.raw(
					`CASE WHEN json_arrayagg(??.??) = '[]' THEN json_arrayagg(??.?? FORMAT JSON) ELSE json_arrayagg(??.??) END as ??`,
					[tableAlias, fieldPair[0], tableAlias, fieldPair[1], tableAlias, fieldPair[0], fieldAlias]
				),
			};
		}
		// simplified
		const fieldPair = [generateAlias(), generateAlias()];
		const fieldPath = this.knex.raw('?', [parts[1]]).toQuery();
		return {
			table: this.knex.raw(
				`json_table(??.??, ${rootPath} COLUMNS (?? PATH ${fieldPath}, ?? FORMAT JSON PATH ${fieldPath})) as ??`,
				[table, column, fieldPair[0], fieldPair[1], tableAlias]
			),
			alias: fieldAlias,
			field: this.knex.raw(
				`CASE WHEN json_arrayagg(??.??) = '[]' THEN json_arrayagg(??.?? FORMAT JSON) ELSE json_arrayagg(??.??) END as ??`,
				[tableAlias, fieldPair[0], tableAlias, fieldPair[1], tableAlias, fieldPair[0], fieldAlias]
			),
		};
	}
	private splitQuery(jsonPath: string): string[] {
		const parts = jsonPath.split('[*]');
		// add wildcards back in
		for (let i = 0; i < parts.length - 1; i++) {
			parts[i] += '[*]';
		}
		// do the same for property wildcards but nested
		return parts
			.flatMap((p) => {
				const _parts = p.split('.*');
				for (let i = 0; i < _parts.length - 1; i++) {
					_parts[i] += '.*';
				}
				return _parts;
			})
			.map((q) => (q.startsWith('$') ? q : '$' + q));
	}
	private applyFilter(
		dbQuery: Knex.QueryBuilder,
		node: JsonFieldNode,
		table: string,
		column: string
	): Knex.QueryBuilder {
		if (!node.query?.filter) return dbQuery;
		logger.info(node.query);
		for (const [jsonPath, value] of Object.entries(node.query?.filter)) {
			const alias = generateAlias();
			const { operator: filterOperator, value: filterValue } = getOperation(jsonPath, value);
			const query = this.knex.raw('?', jsonPath).toQuery();
			dbQuery.select(this.knex.raw(`json_value(??.??, ${query})) as ??`, [table, column, alias]));
			applyJsonFilterQuery(dbQuery, alias, filterOperator, filterValue);
		}

		return dbQuery;
	}
}
