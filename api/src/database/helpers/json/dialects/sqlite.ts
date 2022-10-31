import { Knex } from 'knex';
import { JsonFieldNode } from '../../../../types';
import { JsonHelper } from '../types';
import { customAlphabet } from 'nanoid';

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

export class JsonHelperSQLite extends JsonHelper {
	applyFields(dbQuery: Knex.QueryBuilder, table: string): Knex.QueryBuilder {
		if (this.nodes.length === 0) return dbQuery;
		const selectQueries = this.nodes.filter(({ queryPath }) => queryPath.indexOf('[*]') === -1);
		const joinQueries = this.nodes.filter(({ queryPath }) => queryPath.indexOf('[*]') > 0);
		if (joinQueries.length > 0) {
			for (const node of joinQueries) {
				dbQuery = this.buildWithJson(dbQuery, node, table);
			}
		}
		if (selectQueries.length > 0) {
			dbQuery = dbQuery.select(
				selectQueries.map((node) => {
					return this.knex.raw(this.knex.jsonExtract(`${table}.${node.name}`, node.queryPath, node.fieldKey, false));
				})
			);
		}
		return dbQuery;
	}
	private buildWithJson(dbQuery: Knex.QueryBuilder, node: JsonFieldNode, table: string): Knex.QueryBuilder {
		const { queryPath, name } = node;
		const arrayParts = queryPath.split('[*]').map((q) => (q.startsWith('$') ? q : '$' + q));
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
		subQuery = subQuery
			.fromRaw(this.knex.raw(fromList.map((f) => f.toQuery()).join(',')))
			.groupBy(`${table}.${primaryKey}`);
		return dbQuery
			.with(withAlias, subQuery)
			.select(this.knex.raw('??.?? as ??', [withAlias, aliases[aliases.length - 1], node.fieldKey]))
			.join(withAlias, `${table}.${primaryKey}`, '=', `${withAlias}.${primaryKey}`);
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
}
