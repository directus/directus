import type { AbstractQueryFieldNode, AbstractQueryFieldNodeNestedSingleOne } from '@directus/data';
import type { AbstractSqlQuerySelectJsonNode } from '../../../index.js';

export function convertJson(
	jsonField: AbstractQueryFieldNodeNestedSingleOne,
	tableIndex: number,
	columnIndex: number,
): AbstractSqlQuerySelectJsonNode {
	const path = createListFromTree(jsonField, []);

	return {
		type: 'json',
		tableIndex,
		columnIndex,
		path,
	};
}

function createListFromTree(field: AbstractQueryFieldNode, current: string[]): string[][] {
	const res: string[][] = [];

	if (field.type === 'primitive') {
		current.push(field.field);
		res.push(current);
		return res;
	}

	if (field.type === 'nested-single-one') {
		if (field.nesting.type === 'object-many') {
			current.push(field.nesting.fieldName);

			for (const subfield of field.fields) {
				res.push(...createListFromTree(subfield, [...current]));
			}
		}
	}

	return res;
}
