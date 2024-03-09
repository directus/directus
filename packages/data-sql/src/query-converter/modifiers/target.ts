import type {
	AbstractQueryFunction,
	AbstractQueryTarget,
	AbstractQueryTargetNestedOne,
	AtLeastOneElement,
} from '@directus/data';
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
			return convertJsonTarget(objectPath, target.field, tableIndex, indexGen);
		}

		return convertPrimitiveTarget(tableIndex, target.field);
	} else if (target.type === 'fn') {
		return convertFnTarget(tableIndex, target, indexGen);
	} else {
		return convertNestedOneTarget(target, tableIndex, indexGen, objectPath);
	}
}

function convertPrimitiveTarget(tableIndex: number, targetFieldName: string): TargetConversionResult {
	return {
		value: {
			type: 'primitive',
			tableIndex,
			columnName: targetFieldName,
		},
		joins: [],
		parameters: [],
	};
}

function convertJsonTarget(
	objectPath: AtLeastOneElement<string>,
	targetFieldName: string,
	tableIndex: number,
	indexGen: IndexGenerators,
): TargetConversionResult {
	const columnName = objectPath[0];
	const parameters = [...objectPath, targetFieldName].slice(1) as AtLeastOneElement<string>;
	const path = parameters.map(() => indexGen.parameter.next().value) as AtLeastOneElement<number>;

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
}

function convertFnTarget(
	tableIndex: number,
	target: AbstractQueryFunction,
	indexGen: IndexGenerators,
): TargetConversionResult {
	const convertedFn = convertFn(tableIndex, target, indexGen);

	return {
		value: convertedFn.fn,
		joins: [],
		parameters: [],
	};
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
		// node type is 'object-single'

		const newObjectPath: AtLeastOneElement<string> = [...(objectPath ?? []), nestedTarget.nesting.fieldName];

		const { value, joins, parameters } = convertTarget(nestedTarget.field, tableIndex, indexGen, newObjectPath);

		return {
			value,
			joins,
			parameters,
		};
	}
}
