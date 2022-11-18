import { Item } from '@directus/shared/types';
import { parseJSON } from '@directus/shared/utils';
import { Knex } from 'knex';
import { JsonHelper } from '../types';
import { JSONPath } from 'jsonpath-plus';
import { JsonFieldNode } from '../../../../types';
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

function transformFilterJsonPath(jsonPath: string, filterOperator: string, filterValue: any): string {
	const path = '@' + (jsonPath[0] === '$' ? jsonPath.substring(1) : jsonPath);
	let value = JSON.stringify(filterValue),
		operator;
	switch (filterOperator) {
		case '_eq':
			operator = '==';
			break;
		case '_neq':
			operator = '!=';
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
			operator = 'like_regex';
			value = `"^${filterValue}$" flag "i"`;
			break;
		case '_nieq':
			operator = '! like_regex';
			value = `"^${filterValue}$" flag "i"`;
			break;
		case '_contains':
			operator = 'like_regex';
			break;
		case '_ncontains':
			operator = '! like_regex';
			break;
		case '_icontains':
			operator = 'like_regex';
			value = value + ' flag "i"';
			break;
		case '_nicontains':
			operator = '! like_regex';
			value = value + ' flag "i"';
			break;
		case '_starts_with':
			operator = 'starts with';
			break;
		case '_nstarts_with':
			operator = '! starts with';
			break;
		case '_istarts_with':
			operator = 'like_regex';
			value = `"^${filterValue}" flag "i"`;
			break;
		case '_nistarts_with':
			operator = '! like_regex';
			value = `"^${filterValue}" flag "i"`;
			break;
		case '_ends_with':
			operator = 'like_regex';
			value = `"${filterValue}$"`;
			break;
		case '_nends_with':
			operator = '! like_regex';
			value = `"${filterValue}$"`;
			break;
		case '_iends_with':
			operator = 'like_regex';
			value = `"${filterValue}$" flag "i"`;
			break;
		case '_niends_with':
			operator = '! like_regex';
			value = `"${filterValue}$" flag "i"`;
			break;
		case '_in':
			return (filterValue as any[]).map((val) => transformFilterJsonPath(jsonPath, '_eq', val)).join(' && ');
		case '_nin':
			return (filterValue as any[]).map((val) => transformFilterJsonPath(jsonPath, '_neq', val)).join(' && ');
		case '_between': {
			const conditionA = transformFilterJsonPath(jsonPath, '_gt', filterValue[0]);
			const conditionB = transformFilterJsonPath(jsonPath, '_lt', filterValue[1]);
			return `${conditionA} && ${conditionB}`;
		}
		case '_nbetween': {
			const conditionA = transformFilterJsonPath(jsonPath, '_lt', filterValue[0]);
			const conditionB = transformFilterJsonPath(jsonPath, '_gt', filterValue[1]);
			return `${conditionA} || ${conditionB}`;
		}
	}
	return `${path} ${operator} ${value}`;
}
