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
import { stringify as geojsonToWKT } from 'wellknown';

import { convertAbstractQueryToAbstractSqlQuery } from '../index.js';

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
	let compareTo: ValueNode | ValuesNode | AbstractSqlQuery;

	switch (condition.condition.type) {
		case 'letter-condition':
		case 'number-condition':
			compareTo = {
				type: 'value',
				parameterIndex: generator.next().value,
			} as ValueNode;

			parameters.push(condition.condition.compareTo);

			break;
		case 'geo-condition':
			compareTo = {
				type: 'value',
				parameterIndex: generator.next().value,
			} as ValueNode;

			if (typeof condition.condition.compareTo === 'string') {
				parameters.push(condition.condition.compareTo);
			} else {
				// if the compare value isn't a sting, it must be a GeoJSONGeometry object
				// then convert the geo json object to a wkt string
				parameters.push(geojsonToWKT(condition.condition.compareTo));
			}

			break;
		case 'set-condition':
			if (Array.isArray(condition.condition.compareTo)) {
				// some explicit values have been passed to which should be compared
				compareTo = {
					type: 'values',
					parameterIndexes: condition.condition.compareTo.map(() => generator.next().value),
				} as ValuesNode;

				parameters.push(...condition.condition.compareTo);
			} else {
				// if no explicit values are passen, a sub query is passed
				// then the converter function is called recursively
				compareTo = convertAbstractQueryToAbstractSqlQuery(condition.condition.compareTo);
			}

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
