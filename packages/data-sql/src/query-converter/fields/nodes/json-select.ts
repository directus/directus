import type { AbstractQueryFieldNode, AbstractQueryFieldNodeNestedSingleOne } from '@directus/data';
import type { AbstractSqlQuerySelectJsonNode } from '../../../index.js';
import type { NumberGenerator } from '../../utils/number-generator.js';

export function convertJson(
	jsonField: AbstractQueryFieldNodeNestedSingleOne,
	tableIndex: number,
	columnIndexGenerator: NumberGenerator,
): AbstractSqlQuerySelectJsonNode[] {
	const paths = createListFromTree(jsonField, [], '');
	return createNodes(paths.paths, columnIndexGenerator, tableIndex, paths.jsonColName);
}

let isFirstOccurrence = true;

function createListFromTree(
	field: AbstractQueryFieldNode,
	current: string[],
	jsonColName: string,
): { paths: string[][]; jsonColName: string } {
	const paths: string[][] = [];

	if (field.type === 'primitive') {
		current.push(field.field);
		paths.push(current);
		return { paths, jsonColName };
	}

	if (field.type === 'nested-single-one') {
		if (field.nesting.type === 'object-many') {
			if (isFirstOccurrence) {
				isFirstOccurrence = false;
				jsonColName = field.nesting.fieldName;
			} else {
				current.push(field.nesting.fieldName);
			}

			for (const subfield of field.fields) {
				const subRes = createListFromTree(subfield, [...current], jsonColName);
				paths.push(...subRes.paths);
			}
		}
	}

	return { paths, jsonColName };
}

function createNodes(
	paths: string[][],
	columnIndexGenerator: NumberGenerator,
	tableIndex: number,
	columnName: string,
): AbstractSqlQuerySelectJsonNode[] {
	return paths.map((path) => {
		if (path.length === 0) {
			throw new Error('Not a valid JSON path. Path must have at least one element.');
		}

		return {
			type: 'json',
			tableIndex,
			path,
			columnName,
			columnIndex: columnIndexGenerator.next().value,
		};
	});
}
