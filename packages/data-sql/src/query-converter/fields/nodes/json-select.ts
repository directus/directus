import type { AbstractSqlQuerySelectJsonNode } from '../../../index.js';
import type { NumberGenerator } from '../../utils/number-generator.js';

export function convertJson(
	path: string[],
	tableIndex: number,
	columnName: string,
	columnIndex: number,
	parameterIndexGenerator: NumberGenerator,
): {
	jsonNode: AbstractSqlQuerySelectJsonNode;
	parameter: string[];
} {
	const pathAsIndexes: number[] = [];
	const parameter: string[] = [];

	path.forEach((part) => {
		const index = parameterIndexGenerator.next().value;
		pathAsIndexes.push(index);
		parameter.push(part);
	});

	return {
		jsonNode: {
			type: 'json',
			tableIndex,
			path: pathAsIndexes,
			columnName,
			columnIndex,
		},
		parameter,
	};
}
