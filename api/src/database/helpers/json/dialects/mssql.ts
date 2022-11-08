import { Item } from '@directus/shared/types';
import { parseJSON } from '@directus/shared/utils';
import { Knex } from 'knex';
import { JsonFieldNode } from '../../../../types';
import { JsonHelperFallback } from './fallback';

/**
 * We may want a fallback to support wildcard queries (will be super slow unfortunately)
 */
export class JsonHelperMSSQL extends JsonHelperFallback {
	fallbackNodes: JsonFieldNode[] = [];
	static isSupported(version: string, _full = ''): boolean {
		if (version === '-') return false;
		const major = parseInt(version.split('.')[0]);
		// the json support we need will be added in version 2022
		// https://learn.microsoft.com/en-us/sql/t-sql/functions/json-array-transact-sql?view=sql-server-ver16
		return major >= 16; // SQL Server 2022 (16.x) Preview
	}
	preProcess(dbQuery: Knex.QueryBuilder, table: string): Knex.QueryBuilder {
		if (this.nodes.length === 0) return dbQuery;
		const selectQueries = this.nodes.filter(({ jsonPath }) => jsonPath.indexOf('*') === -1);
		const joinQueries = this.nodes.filter(({ jsonPath }) => jsonPath.indexOf('*') > 0);
		if (joinQueries.length > 0) {
			// no viable solutions found yet without JSON_ARRAY support
			// fallback to postprocessing for these queries
			this.fallbackNodes = joinQueries;
		}
		if (selectQueries.length > 0) {
			dbQuery = dbQuery.select(this.nodes.map((node) => this.jsonQueryOrValue(`${table}.${node.name}`, node)));
		}
		return dbQuery;
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
		if (this.nodes.length === 0) return;
		for (const item of items) {
			for (const jsonNode of this.fallbackNodes) {
				this.postProcessItem(item, jsonNode);
			}
			for (const { fieldKey: key } of this.nodes) {
				if (key in item && typeof item[key] === 'string') {
					try {
						item[key] = parseJSON(item[key]);
					} catch {
						// in case a single string value was returned
					}
				}
			}
		}
	}
}
