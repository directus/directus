import { Item } from '@directus/shared/types';
import { parseJSON } from '@directus/shared/utils';
import { Knex } from 'knex';
import { JsonHelper } from '../types';
import { JSONPath } from 'jsonpath-plus';
import { JsonFieldNode } from '../../../../types';
import { getOperation } from '../../../../utils/apply-query';
import { InvalidQueryException } from '../../../../exceptions';

const jsonPathPlusOptions = {
	wrap: false,
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
		const fallbackResponse = node.query?.filter ? [] : null;
		try {
			const data = typeof item[node.fieldKey] === 'string' ? parseJSON(item[node.fieldKey]) : item[node.fieldKey];
			const jsonPath = Object.keys(node.query).length === 0 ? node.jsonPath : this.buildFilterPath(node);
			item[node.fieldKey] =
				JSONPath({
					...jsonPathPlusOptions,
					path: jsonPath,
					json: data,
				}) ?? fallbackResponse;
		} catch (e) {
			item[node.fieldKey] = fallbackResponse;
		}
	}
	protected buildFilterPath(node: JsonFieldNode) {
		if (!node.query?.filter) return node.jsonPath;

		const conditions = [];
		for (const [jsonPath, value] of Object.entries(node.query?.filter)) {
			const { operator: filterOperator, value: filterValue } = getOperation(jsonPath, value);
			conditions.push(this.transformFilterJsonPath(jsonPath, filterOperator, filterValue));
		}
		let path = node.jsonPath;
		if (node.jsonPath.endsWith('[*]')) {
			path = node.jsonPath.substring(0, node.jsonPath.length - 3);
		}
		return `${path}[?(${conditions.join(' && ')})]`;
	}
	filterQuery(_collection: string, _node: JsonFieldNode): Knex.Raw | null {
		throw new InvalidQueryException(`Using JSON Query in regular filters is not supported by this database.`);
	}
	protected transformFilterJsonPath(jsonPath: string, filterOperator: string, filterValue: any): string {
		const path = '@' + (jsonPath[0] === '$' ? jsonPath.substring(1) : jsonPath),
			value = JSON.stringify(filterValue);
		let operator = '';
		switch (filterOperator) {
			case '_eq':
				operator = '===';
				break;
			case '_neq':
				operator = '!==';
				break;
			case '_gt':
				operator = '>';
				break;
			case '_gte':
				operator = '>=';
				break;
			case '_lt':
				operator = '<';
				break;
			case '_lte':
				operator = '<=';
				break;
			case '_ieq':
				return `${path}.match(/^${filterValue}$/i)`;
			case '_nieq':
				return `!${path}.match(/^${filterValue}$/i)`;
			case '_contains':
				return `${path}.match(/${filterValue}/)`;
			case '_ncontains':
				return `!${path}.match(/${filterValue}/)`;
			case '_icontains':
				return `${path}.match(/${filterValue}/i)`;
			case '_nicontains':
				return `!${path}.match(/${filterValue}/i)`;
			case '_starts_with':
				return `${path}.match(/^${filterValue}/)`;
			case '_nstarts_with':
				return `!${path}.match(/^${filterValue}/)`;
			case '_istarts_with':
				return `${path}.match(/^${filterValue}/i)`;
			case '_nistarts_with':
				return `!${path}.match(/^${filterValue}/i)`;
			case '_ends_with':
				return `${path}.match(/${filterValue}$/)`;
			case '_nends_with':
				return `!${path}.match(/${filterValue}$/)`;
			case '_iends_with':
				return `${path}.match(/${filterValue}$/i)`;
			case '_niends_with':
				return `!${path}.match(/${filterValue}$/i)`;
			case '_in':
				return (filterValue as any[]).map((val) => this.transformFilterJsonPath(jsonPath, '_eq', val)).join(' && ');
			case '_nin':
				return (filterValue as any[]).map((val) => this.transformFilterJsonPath(jsonPath, '_neq', val)).join(' && ');
			case '_between': {
				const conditionA = this.transformFilterJsonPath(jsonPath, '_gt', filterValue[0]);
				const conditionB = this.transformFilterJsonPath(jsonPath, '_lt', filterValue[1]);
				return `${conditionA} && ${conditionB}`;
			}
			case '_nbetween': {
				const conditionA = this.transformFilterJsonPath(jsonPath, '_lt', filterValue[0]);
				const conditionB = this.transformFilterJsonPath(jsonPath, '_gt', filterValue[1]);
				return `${conditionA} || ${conditionB}`;
			}
		}
		return `${path} ${operator} ${value}`;
	}
	hasWildcard(jsonPath: string) {
		return jsonPath.includes('[*]') || jsonPath.includes('.*');
	}
}
