import { Item } from '@directus/shared/types';
import { Knex } from 'knex';
import { JsonFieldNode } from '../../../../types';
import { JsonHelperDefault } from './default';

/**
 * JSON support for SQL Server 2016+
 */
export class JsonHelperMSSQL_13 extends JsonHelperDefault {
	fallbackNodes: JsonFieldNode[] = [];
	preProcess(dbQuery: Knex.QueryBuilder, table: string): void {
		// with wildcards we're falling back to post-processing
		const joinQueries = this.nodes.filter(({ jsonPath }) => jsonPath.indexOf('*') > 0);
		if (joinQueries.length > 0) {
			// no viable native solutions found without JSON_ARRAY support
			this.fallbackNodes = joinQueries;
			dbQuery.select(
				joinQueries.map((node) => {
					return this.knex.raw('??.?? as ??', [table, node.name, node.fieldKey]);
				})
			);
		}
		// without wildcards the query can be directly fetched using native functions
		const selectQueries = this.nodes.filter(({ jsonPath }) => jsonPath.indexOf('*') === -1);
		if (selectQueries.length > 0) {
			dbQuery.select(this.nodes.map((node) => this.jsonQueryOrValue(`${table}.${node.name}`, node)));
		}
		dbQuery.from(table);
	}
	private jsonQueryOrValue(field: string, node: JsonFieldNode): Knex.Raw | null {
		// MS SQL has different functions for getting either an `object | array` or `string | number | boolean`
		// because we dont know what result is expected we're using `COALESCE` to run both
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
	filterQuery(collection: string, node: JsonFieldNode): Knex.Raw {
		// uses the native `JSON_VALUE(...)` to extract filter values
		// https://learn.microsoft.com/en-us/sql/t-sql/functions/json-value-transact-sql?view=sql-server-ver16
		return this.knex.raw(`JSON_VALUE(??.??, ?)`, [collection, node.name, node.jsonPath]);
	}
}
