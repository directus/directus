import { Item } from '@directus/shared/types';
import { Knex } from 'knex';
import { JsonFieldNode } from '../../../../types';
import { getOperation } from '../../../../utils/apply-query';
import { JsonHelperDefault } from './default';

/**
 * JSON support for MySQL 5.7+
 */
export class JsonHelperMySQL_5 extends JsonHelperDefault {
	preProcess(dbQuery: Knex.QueryBuilder, table: string): void {
		// uses the native `JSON_EXTRACT(...)` to extract field values
		dbQuery
			.select(
				this.nodes.map((node) => {
					const q = this.knex.raw('?', [node.jsonPath]).toQuery();
					return this.knex.raw(`JSON_EXTRACT(??.??, ${q}) as ??`, [table, node.name, node.fieldKey]);
				})
			)
			.from(table);
	}
	postProcess(items: Item[]): void {
		this.postProcessParseJSON(items);
		// using fallback for nodes with filters for better consistency with other vendors
		this.postProcessFallback(
			items,
			this.nodes.filter((node) => {
				return Object.keys(node.query).length > 0;
			})
		);
	}
	filterQuery(collection: string, node: JsonFieldNode): Knex.Raw {
		// uses the native `JSON_EXTRACT(...)` to extract filter values
		// https://dev.mysql.com/doc/refman/5.7/en/json-search-functions.html#function_json-extract
		return this.knex.raw(`JSON_EXTRACT(??.??, ?)`, [collection, node.name, node.jsonPath]);
	}
}
