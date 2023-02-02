import { Knex } from 'knex';
import { JsonFieldNode } from '../../../../types';
import { JsonHelperDefault } from './default';
import { getOperation } from '../../../../utils/apply-query';
import { applyJsonFilterQuery } from '../filters';
import { Item } from '@directus/shared/types';
import { generateAlias } from '../../../../utils/generate-alias';

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
/**
 * To support deep queries consistently the above needs to be extended to:

WITH xyz AS (
    SELECT jason.id, json_group_array(json_extract(K.value, "$.b")) as X
    FROM jason, json_each(jason.data, "$") J, json_each(J.value, "$.a") K
	WHERE X >= 10
    GROUP BY jason.id
)
select jason.id, xyz.X
from jason
join xyz ON xyz.id = jason.id;
 */

export class JsonHelperSQLite extends JsonHelperDefault {
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
			for (const node of joinQueries) {
				this.buildWithJson(dbQuery, node, table);
			}
		}
		if (selectQueries.length > 0) {
			dbQuery.select(
				selectQueries.map((node) => {
					return this.knex.raw(this.knex.jsonExtract(`${table}.${node.name}`, node.jsonPath, node.fieldKey, false));
				})
			);
		}
		dbQuery.from(table);
	}
	postProcess(items: Item[]): void {
		this.postProcessParseJSON(items);
	}
	private buildWithJson(dbQuery: Knex.QueryBuilder, node: JsonFieldNode, table: string): Knex.QueryBuilder {
		const { jsonPath, name } = node;
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
		const subQuery = this.knex.select(`${table}.${primaryKey}`);
		for (let i = 1; i < arrayParts.length - 1; i++) {
			fromList.push(this.knex.raw('json_each(??.value, ?) as ??', [aliases[i - 1], arrayParts[i], aliases[i]]));
		}
		const conditions = [];
		if (node.query?.filter) {
			for (const [jsonPath, value] of Object.entries(node.query?.filter)) {
				let alias = aliases[0];
				if (arrayParts.length > 1) {
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
			applyJsonFilterQuery(subQuery, alias, operator, value, 'and');
		}
		subQuery.groupBy(`${table}.${primaryKey}`);
		dbQuery
			.with(withAlias, subQuery)
			.select(this.knex.raw('??.?? as ??', [withAlias, aliases[aliases.length - 1], node.fieldKey]))
			.join(withAlias, `${table}.${primaryKey}`, '=', `${withAlias}.${primaryKey}`);
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
		return this.knex.raw(`json_extract(??.??, ?)`, [collection, node.name, node.jsonPath]);
	}
}
