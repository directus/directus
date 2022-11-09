import { Knex } from 'knex';
import { JsonFieldNode } from '../../../../types';
import { customAlphabet } from 'nanoid';
import { JsonHelperDefault } from './default';
import { getOperation } from '../../../../utils/apply-query';
import logger from '../../../../logger';

const generateAlias = customAlphabet('abcdefghijklmnopqrstuvwxyz', 5);

/**
 * To support first-level array queries consistently we will need to get to a query like:

WITH xyz AS (
    SELECT jason.id, json_group_array(json_extract(value, "$.test")) as X
    FROM jason, json_each(jason.data, "$")
    GROUP BY jason.id
)
select jason.id, xyz.X
from jason
join xyz ON xyz.id = jason.id;
 */
/**
 * To support nested array queries consistently the above needs to be extended to:

WITH xyz AS (
    SELECT jason.id, json_group_array(json_extract(K.value, "$.b")) as X
    FROM jason, json_each(jason.data, "$") J, json_each(J.value, "$.a") K
    GROUP BY jason.id
)
select jason.id, xyz.X
from jason
join xyz ON xyz.id = jason.id;
 */

export class JsonHelperSQLite extends JsonHelperDefault {
	static isSupported(version: string, _full = ''): boolean {
		if (version === '-') return false;
		// sqlite3 added support by default in 3.38
		// TODO check json extension before that maybe?
		const [majorStr, minorStr] = version.split('.');
		const major = parseInt(majorStr);
		const minor = parseInt(minorStr);
		if (major === 3 && minor >= 38) return true; // 3.38 or higher
		return false;
	}
	preProcess(dbQuery: Knex.QueryBuilder, table: string): Knex.QueryBuilder {
		if (this.nodes.length === 0) return dbQuery.from(table);

		const selectQueries = this.nodes.filter(
			({ jsonPath, query }) =>
				jsonPath.indexOf('[*]') === -1 && jsonPath.indexOf('.*') === -1 && Object.keys(query).length === 0
		);
		const joinQueries = this.nodes.filter(
			({ jsonPath, query }) =>
				jsonPath.indexOf('[*]') > 0 || jsonPath.indexOf('.*') > 0 || Object.keys(query).length > 0
		);

		if (joinQueries.length > 0) {
			for (const node of joinQueries) {
				dbQuery = this.buildWithJson(dbQuery, node, table);
			}
		}
		if (selectQueries.length > 0) {
			dbQuery = dbQuery.select(
				selectQueries.map((node) => {
					return this.knex.raw(this.knex.jsonExtract(`${table}.${node.name}`, node.jsonPath, node.fieldKey, false));
				})
			);
		}
		return dbQuery.from(table);
	}
	private buildWithJson(dbQuery: Knex.QueryBuilder, node: JsonFieldNode, table: string): Knex.QueryBuilder {
		const { jsonPath, name } = node;
		const arrayParts = jsonPath
			.split('[*]')
			.flatMap((p) => p.split('.*'))
			.map((q) => (q.startsWith('$') ? q : '$' + q));
		logger.info(arrayParts);
		const aliases = arrayParts.map(() => generateAlias()),
			withAlias = generateAlias();
		const primaryKey = this.schema.collections[table].primary;
		const fromList = [
			this.knex.raw('??', [table]),
			this.knex.raw('json_each(??.??, ?) as ??', [table, name, arrayParts[0], aliases[0]]),
		];
		let subQuery = this.knex.select([`${table}.${primaryKey}`, this.buildJsonGroupArray(arrayParts, aliases)]);
		for (let i = 1; i < arrayParts.length - 1; i++) {
			fromList.push(this.knex.raw('json_each(??.value, ?) as ??', [aliases[i - 1], arrayParts[i], aliases[i]]));
		}
		subQuery = this.applyFilter(
			subQuery.fromRaw(this.knex.raw(fromList.map((f) => f.toQuery()).join(','))),
			node,
			aliases[aliases.length - 2]
		).groupBy(`${table}.${primaryKey}`);
		dbQuery = dbQuery
			.with(withAlias, subQuery)
			.select(this.knex.raw('??.?? as ??', [withAlias, aliases[aliases.length - 1], node.fieldKey]))
			.join(withAlias, `${table}.${primaryKey}`, '=', `${withAlias}.${primaryKey}`);
		return dbQuery;
	}
	private buildJsonGroupArray(queryParts: string[], aliases: string[]): Knex.Raw {
		const currentAlias = aliases[aliases.length - 1],
			prevAlias = aliases[aliases.length - 2],
			currentQuery = queryParts[queryParts.length - 1];
		return this.knex.raw('json_group_array(json_extract(??.??, ?)) as ??', [
			prevAlias,
			'value',
			currentQuery,
			currentAlias,
		]);
	}
	private applyFilter(dbQuery: Knex.QueryBuilder, node: JsonFieldNode, oldAlias: string): Knex.QueryBuilder {
		if (!node.query?.filter) return dbQuery;
		for (const [jsonPath, value] of Object.entries(node.query?.filter)) {
			const alias = generateAlias();
			const { operator: filterOperator, value: filterValue } = getOperation(jsonPath, value);
			dbQuery = dbQuery.select(this.knex.raw('json_extract(??.value, ?) as ??', [oldAlias, jsonPath, alias]));
			if (filterOperator === '_in') {
				let value = filterValue;
				if (typeof value === 'string') value = value.split(',');

				dbQuery['and'].whereIn(alias, value as string[]);
			}
		}

		return dbQuery;
	}
}
