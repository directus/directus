import type { AtLeastOneElement } from '@directus/data';
import type { AbstractSqlQuerySelectJsonNode } from '../../../types/clauses/select/json.js';
import type { IndexGenerators } from '../../utils/create-index-generators.js';

export function convertJson(
	tableIndex: number,
	objectPath: AtLeastOneElement<string>,
	columnIndex: number,
	indexGen: IndexGenerators,
): {
	jsonNode: AbstractSqlQuerySelectJsonNode;
	parameters: string[];
} {
	const columnName = objectPath[0];
	const parameters = objectPath.slice(1);

	const path = parameters.map(() => indexGen.parameter.next().value) as AtLeastOneElement<number>;

	return {
		jsonNode: {
			type: 'json',
			tableIndex,
			columnName,
			columnIndex,
			path,
		},
		parameters,
	};
}
