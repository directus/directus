import type { AbstractQueryTarget, AbstractQueryTargetNestedOne } from '@directus/data';
import type { AbstractSqlQueryJoinNode, AbstractSqlQueryTargetNode } from '../../types/index.js';
import type { IndexGenerators } from '../../utils/create-index-generators.js';
import { convertFn } from '../common/function.js';
import { createJoin } from '../fields/create-join.js';

export interface TargetConversionResult {
	value: AbstractSqlQueryTargetNode;
	joins: AbstractSqlQueryJoinNode[];
}

export function convertTarget(
	target: AbstractQueryTarget,
	tableIndex: number,
	indexGen: IndexGenerators,
): TargetConversionResult {
	if (target.type === 'primitive') {
		return {
			value: {
				type: 'primitive',
				tableIndex,
				columnName: target.field,
			},
			joins: [],
		};
	} else if (target.type === 'fn') {
		const convertedFn = convertFn(tableIndex, target, indexGen);

		return {
			value: convertedFn.fn,
			joins: [],
		};
	} else {
		const { value, joins } = convertNestedOneTarget(target, tableIndex, indexGen);

		return {
			value,
			joins,
		};
	}
}

/**
 * Convert a nested one target node into a join and where clause.
 * @param nestedTarget
 */
export function convertNestedOneTarget(
	nestedTarget: AbstractQueryTargetNestedOne,
	tableIndex: number,
	indexGen: IndexGenerators,
): TargetConversionResult {
	const tableIndexRelational = indexGen.table.next().value;

	const join = createJoin(nestedTarget.nesting, tableIndex, tableIndexRelational);

	const { value, joins } = convertTarget(nestedTarget.field, tableIndexRelational, indexGen);

	return {
		value,
		joins: [join, ...joins],
	};
}
