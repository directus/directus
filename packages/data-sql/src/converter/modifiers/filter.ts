import type { AbstractQueryFilterNode, AbstractQueryNodeLogical, AbstractQueryConditionNode } from '@directus/data';
import type {
	AbstractSqlQuery,
	AbstractSqlQueryConditionNode,
	AbstractSqlQueryFnNode,
	AbstractSqlQuerySelectNode,
	ParameterTypes,
	ValueNode,
	ValuesNode,
} from '../../types.js';
import { convertFn } from '../functions.js';

/**
 * Basically extracts the filter values and replaces it with parameter indexes.
 * It also converts the negation format.
 *
 * @param filter - all filter conditions
 * @param collection - the name of the collection
 * @param firstParameterIndex - The index of the parameter. Mandatory for all operators.
 * @param secondParameterIndex - The index of an additional parameter. Only needed for some operators like BETWEEN.
 * @returns
 */
export const convertFilter = (
	filter: AbstractQueryFilterNode,
	collection: string,
	generator: Generator<number, never, never>
): Required<Pick<AbstractSqlQuery, 'where' | 'parameters'>> => {
	return convertFilterWithNegate(filter, collection, generator, false);
};

/**
 * This function is called recursively for negation and logical nodes.
 *
 * @param filter the various filter node
 * @param collection name of the collection
 * @param generator to generate parameter indexes
 * @param negate
 * @returns the where part part and the parameters used for this part
 */
const convertFilterWithNegate = (
	filter: AbstractQueryFilterNode,
	collection: string,
	generator: Generator<number, never, never>,
	negate: boolean
): Required<Pick<AbstractSqlQuery, 'where' | 'parameters'>> => {
	if (filter.type === 'condition') {
		return convertCondition(filter as AbstractQueryConditionNode, collection, generator, negate);
	} else if (filter.type === 'negate') {
		return convertFilterWithNegate(filter.childNode, collection, generator, !negate);
	} else if (filter.type === 'logical') {
		return convertLogical(filter, collection, generator, negate);
	} else {
		throw new Error(`Unknown filter type`);
	}
};

export function convertCondition(
	condition: AbstractQueryConditionNode,
	collection: string,
	generator: Generator<number, never, never>,
	negate: boolean
): Required<Pick<AbstractSqlQuery, 'where' | 'parameters'>> {
	// convert target
	let target: AbstractSqlQueryFnNode | AbstractSqlQuerySelectNode;
	const parameters: ParameterTypes[] = [];

	if (condition.condition.target.type === 'primitive') {
		target = {
			type: 'primitive',
			table: collection,
			column: condition.condition.target.field,
		};
	} else if (condition.condition.target.type === 'fn') {
		const convertedFn = convertFn(collection, condition.condition.target, generator);
		target = convertedFn.fn;
		parameters.push(...convertedFn.parameters);
	} else {
		throw new Error('The related field types are not yet supported.');
	}

	// convert compareTo
	let compareTo: ValueNode | ValuesNode;

	switch (condition.condition.type) {
		case 'condition-letter':
		case 'condition-number':
			compareTo = {
				type: 'value',
				parameterIndex: generator.next().value,
			} as ValueNode;

			parameters.push(condition.condition.compareTo);
			break;
		case 'condition-geo':
			compareTo = {
				type: 'value',
				parameterIndex: generator.next().value,
			} as ValueNode;

			parameters.push(condition.condition.compareTo);
			break;
		case 'condition-set':
			compareTo = {
				type: 'values',
				parameterIndexes: Array.from(condition.condition.compareTo).map(() => generator.next().value),
			} as ValuesNode;

			parameters.push(...condition.condition.compareTo);
			break;
	}

	const res = {
		type: condition.type,
		negate,
		condition: {
			type: condition.condition.type,
			operation: condition.condition.operation,
			target,
			compareTo,
		},
	};

	return {
		where: res as AbstractSqlQueryConditionNode,
		parameters: [...parameters],
	};
}

function convertLogical(
	filter: AbstractQueryNodeLogical,
	collection: string,
	generator: Generator<number, never, never>,
	negate: boolean
): Required<Pick<AbstractSqlQuery, 'where' | 'parameters'>> {
	const children = filter.childNodes.map((childNode) =>
		convertFilterWithNegate(childNode, collection, generator, false)
	);

	return {
		where: {
			type: 'logical',
			negate,
			operator: filter.operator,
			childNodes: children.map((child) => child.where),
		},
		parameters: children.flatMap((child) => child.parameters),
	};
}
