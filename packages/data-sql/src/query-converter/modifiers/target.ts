import type { AbstractQueryTarget, AbstractQueryTargetNestedOne, AtLeastOneElement } from '@directus/data';
import type { AbstractSqlQueryJoinNode, AbstractSqlQueryTargetNode } from '../../types/index.js';
import { convertFn } from '../common/function.js';
import { createJoin } from '../fields/nodes/join.js';
import type { IndexGenerators } from '../utils/create-index-generators.js';

export interface TargetConversionResult {
	value: AbstractSqlQueryTargetNode;
	joins: AbstractSqlQueryJoinNode[];
	parameters: string[];
}

export function convertTarget(
	target: AbstractQueryTarget,
	tableIndex: number,
	indexGen: IndexGenerators,
	objectPath: AtLeastOneElement<string> | null = null,
): TargetConversionResult {
	if (target.type === 'primitive') {
		if (objectPath !== null) {
			const columnName = objectPath[0];
			const parameters = [...objectPath, target.field].slice(1);

			const path = parameters.map(() => indexGen.parameter.next().value);

			return {
				value: {
					type: 'json',
					tableIndex,
					columnName,
					path,
				},
				joins: [],
				parameters,
			};
		} else {
			return {
				value: {
					type: 'primitive',
					tableIndex,
					columnName: target.field,
				},
				joins: [],
				parameters: [],
			};
		}
	} else if (target.type === 'fn') {
		const convertedFn = convertFn(tableIndex, target, indexGen);

		return {
			value: convertedFn.fn,
			joins: [],
			parameters: [],
		};
	} else {
		const { value, joins } = convertNestedOneTarget(target, tableIndex, indexGen, objectPath);

		return {
			value,
			joins,
			parameters: [],
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
	objectPath: AtLeastOneElement<string> | null = null,
): TargetConversionResult {
	if (nestedTarget.nesting.type === 'relational-single') {
		const tableIndexRelational = indexGen.table.next().value;

		const join = createJoin(nestedTarget.nesting, tableIndex, tableIndexRelational);

		const { value, joins, parameters } = convertTarget(nestedTarget.field, tableIndexRelational, indexGen);

		return {
			value,
			joins: [join, ...joins],
			parameters,
		};
	} else {
		const newObjectPath: AtLeastOneElement<string> = [...(objectPath ?? []), nestedTarget.nesting.fieldName];

		const { value, joins, parameters } = convertTarget(nestedTarget.field, tableIndex, indexGen, newObjectPath);

		return {
			value,
			joins,
			parameters,
		};
	}
}
