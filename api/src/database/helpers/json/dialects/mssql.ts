import { Item } from '@directus/shared/types';
import { Knex } from 'knex';
import { JsonFieldNode } from '../../../../types';
import { JsonHelperDefault } from './default';

/**
 * We may want a fallback to support wildcard queries (will be super slow unfortunately)
 */
export class JsonHelperMSSQL extends JsonHelperDefault {
	fallbackNodes: JsonFieldNode[] = [];
	static isSupported({ parsed }: { parsed: number[]; full: string }): boolean {
		if (parsed.length === 0) return false;
		const [major] = parsed;
		// the json support we need will be added in version 2022
		// https://learn.microsoft.com/en-us/sql/t-sql/functions/json-array-transact-sql?view=sql-server-ver16
		return major >= 16; // SQL Server 2022 (16.x) Preview
	}
	preProcess(dbQuery: Knex.QueryBuilder, table: string): void {
		const selectQueries = this.nodes.filter(({ jsonPath }) => jsonPath.indexOf('*') === -1);
		const joinQueries = this.nodes.filter(({ jsonPath }) => jsonPath.indexOf('*') > 0);
		if (joinQueries.length > 0) {
			// no viable solutions found yet without JSON_ARRAY support
			// fallback to postprocessing for these queries
			this.fallbackNodes = joinQueries;
			dbQuery.select(
				joinQueries.map((node) => {
					return this.knex.raw('??.?? as ??', [table, node.name, node.fieldKey]);
				})
			);
		}
		if (selectQueries.length > 0) {
			dbQuery.select(this.nodes.map((node) => this.jsonQueryOrValue(`${table}.${node.name}`, node)));
		}
		dbQuery.from(table);
	}
	private jsonQueryOrValue(field: string, node: JsonFieldNode): Knex.Raw {
		const qPath = this.knex.raw('?', [node.jsonPath]).toQuery();
		return this.knex.raw(`COALESCE(JSON_QUERY(??, ${qPath}), JSON_VALUE(??, ${qPath})) as ??`, [
			field,
			field,
			node.fieldKey,
		]);
	}
	postProcess(items: Item[]): void {
		for (const item of items) {
			for (const jsonNode of this.fallbackNodes) {
				this.postProcessJsonPath(item, jsonNode);
			}
		}
		this.postProcessParseJSON(items);
	}
}
