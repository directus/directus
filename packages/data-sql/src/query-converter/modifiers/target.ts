import type { AbstractQueryTarget, AbstractQueryTargetNestedOne } from '@directus/data';
import { createUniqueAlias } from '../../orm/create-unique-alias.js';
import type {
	AbstractSqlQueryFnNode,
	AbstractSqlQueryJoinNode,
	AbstractSqlQuerySelectNode,
} from '../../types/index.js';
import { createJoin } from '../fields/create-join.js';
import { convertFn } from '../functions.js';

export interface TargetConversionResult {
	value: AbstractSqlQuerySelectNode | AbstractSqlQueryFnNode;
	joins: AbstractSqlQueryJoinNode[];
}

export function convertTarget(
	target: AbstractQueryTarget,
	collection: string,
	idxGenerator: Generator<number, number, number>,
): TargetConversionResult {
	if (target.type === 'primitive') {
		return {
			value: {
				type: 'primitive',
				table: collection,
				column: target.field,
			},
			joins: [],
		};
	} else if (target.type === 'fn') {
		const convertedFn = convertFn(collection, target, idxGenerator);

		return {
			value: convertedFn.fn,
			joins: [],
		};
	} else {
		const { value, joins } = convertNestedOneTarget(collection, target, idxGenerator);

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
	currentCollection: string,
	nestedTarget: AbstractQueryTargetNestedOne,
	idxGenerator: Generator<number, number, number>,
): TargetConversionResult {
	const externalCollectionAlias = createUniqueAlias(nestedTarget.nesting.foreign.collection);

	const join = createJoin(currentCollection, nestedTarget.nesting, externalCollectionAlias);

	const { value, joins } = convertTarget(nestedTarget.field, externalCollectionAlias, idxGenerator);

	return {
		value,
		joins: [join, ...joins],
	};
}
