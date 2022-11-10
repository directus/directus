import { Item } from '@directus/shared/types';
import { parseJSON } from '@directus/shared/utils';
import { Knex } from 'knex';
import { JsonHelper } from '../types';
import { JSONPath } from 'jsonpath-plus';
import { JsonFieldNode } from '../../../../types';
import { transformFilterJsonPath } from './postgres';
import { getOperation } from '../../../../utils/apply-query';

const jsonPathPlusOptions = {
	preventEval: true,
};

/**
 *
 */
export class JsonHelperFallback extends JsonHelper {
	// some fallback logic for vendors not supporting joins thus not allowing for `filter` or `deep` queries.
	preProcess(dbQuery: Knex.QueryBuilder, table: string): void {
		dbQuery
			.select(
				this.nodes.map((node) => {
					return this.knex.raw('??.?? as ??', [table, node.name, node.fieldKey]);
				})
			)
			.from(table);
	}
	postProcess(items: Item[]): void {
		if (this.nodes.length === 0) return;
		for (const item of items) {
			for (const jsonNode of this.nodes) {
				this.postProcessItem(item, jsonNode);
			}
		}
	}
	postProcessItem(item: Item, node: JsonFieldNode) {
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
	buildFilterPath(node: JsonFieldNode) {
		if (!node.query?.filter) return node.jsonPath;

		const conditions = [];
		for (const [jsonPath, value] of Object.entries(node.query?.filter)) {
			const { operator: filterOperator, value: filterValue } = getOperation(jsonPath, value);
			conditions.push(transformFilterJsonPath(jsonPath, filterOperator, filterValue));
		}

		return `${node.jsonPath}[?(${conditions.join(' && ')})]`;
	}
}
