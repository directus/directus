import type { AbstractQueryFieldNode, AbstractQueryFieldNodeNestedSingleOne } from '@directus/data';
import type { AbstractSqlQuerySelectJsonNode, Path } from '../../../index.js';
import type { NumberGenerator } from '../../utils/number-generator.js';

export function convertJson(
	jsonField: AbstractQueryFieldNodeNestedSingleOne,
	tableIndex: number,
	columnIndexGenerator: NumberGenerator,
): AbstractSqlQuerySelectJsonNode {
	const paths = createListFromTree(jsonField, []);
	const pathsWithColumnIndex = enhanceWithColumnIndex(paths, columnIndexGenerator);

	return {
		type: 'json',
		tableIndex,
		paths: pathsWithColumnIndex,
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

function enhanceWithColumnIndex(paths: string[][], columnIndexGenerator: NumberGenerator): Path[] {
	return paths.map((path) => ({
		path,
		columnIndex: columnIndexGenerator.next().value,
	}));
}
