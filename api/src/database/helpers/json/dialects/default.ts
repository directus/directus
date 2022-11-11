import { Item } from '@directus/shared/types';
import { parseJSON } from '@directus/shared/utils';
import { Knex } from 'knex';
import { JsonHelper } from '../types';
import { JSONPath } from 'jsonpath-plus';
import { JsonFieldNode } from '../../../../types';
import { transformFilterJsonPath } from './postgres';
import { getOperation } from '../../../../utils/apply-query';

const jsonPathPlusOptions = {
	// preventEval: true,
};

/**
 * The default handler holds shared functions and fallback features
 */
export class JsonHelperDefault extends JsonHelper {
	preProcess(dbQuery: Knex.QueryBuilder, table: string): void {
		// default behavior is post-processing json
		this.preProcessFallback(dbQuery, table);
	}
	preProcessKnex(dbQuery: Knex.QueryBuilder, table: string): void {
		dbQuery
			.select(
				this.nodes.map((node) => {
					return this.knex.raw(this.knex.jsonExtract(`${table}.${node.name}`, node.jsonPath, node.fieldKey, false));
				})
			)
			.from(table);
	}
	preProcessFallback(dbQuery: Knex.QueryBuilder, table: string): void {
		dbQuery
			.select(
				this.nodes.map((node) => {
					return this.knex.raw('??.?? as ??', [table, node.name, node.fieldKey]);
				})
			)
			.from(table);
	}
	postProcess(items: Item[]): void {
		this.postProcessParseJSON(items);
		this.postProcessFallback(items);
	}
	postProcessParseJSON(items: Item[]): void {
		const keys = this.nodes.map(({ fieldKey }) => fieldKey);
		for (const item of items) {
			for (const jsonAlias of keys) {
				if (jsonAlias in item && typeof item[jsonAlias] === 'string') {
					try {
						item[jsonAlias] = parseJSON(item[jsonAlias]);
					} catch {
						// in case a single string value was returned
					}
				}
			}
		}
	}
	postProcessFallback(items: Item[]): void {
		for (const item of items) {
			for (const jsonNode of this.nodes) {
				this.postProcessJsonPath(item, jsonNode);
			}
		}
	}
	protected postProcessJsonPath(item: Item, node: JsonFieldNode) {
		try {
			const data = typeof item[node.fieldKey] === 'string' ? parseJSON(item[node.fieldKey]) : item[node.fieldKey];
			const jsonPath = Object.keys(node.query).length === 0 ? node.jsonPath : this.buildFilterPath(node);

			item[node.fieldKey] = JSONPath({
				...jsonPathPlusOptions,
				path: jsonPath,
				json: data,
			});
		} catch (e) {
			item[node.fieldKey] = null;
		}
	}
	protected buildFilterPath(node: JsonFieldNode) {
		if (!node.query?.filter) return node.jsonPath;

		const conditions = [];
		for (const [jsonPath, value] of Object.entries(node.query?.filter)) {
			const { operator: filterOperator, value: filterValue } = getOperation(jsonPath, value);
			conditions.push(transformFilterJsonPath(jsonPath, filterOperator, filterValue));
		}

		return `${node.jsonPath}[?(${conditions.join(' && ')})]`;
	}
}
