import type { AbstractQueryTarget, AbstractQueryTargetNestedOne } from '@directus/data';
import type { AbstractSqlQueryJoinNode, AbstractSqlQueryTargetNode } from '../../types/index.js';
import type { IndexGenerators } from '../../utils/create-index-generators.js';
import { createUniqueAlias } from '../../utils/create-unique-alias.js';
import { convertFn } from '../common/function.js';
import { createJoin } from '../fields/create-join.js';

export interface TargetConversionResult {
	value: AbstractSqlQueryTargetNode;
	joins: AbstractSqlQueryJoinNode[];
}

export function convertTarget(
	target: AbstractQueryTarget,
	collection: string,
	indexGen: IndexGenerators,
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
		const convertedFn = convertFn(collection, target, indexGen);

		return {
			value: convertedFn.fn,
			joins: [],
		};
	} else {
		const { value, joins } = convertNestedOneTarget(collection, target, indexGen);

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
	indexGen: IndexGenerators,
): TargetConversionResult {
	const externalCollectionAlias = createUniqueAlias(nestedTarget.nesting.foreign.collection);

	const join = createJoin(currentCollection, nestedTarget.nesting, externalCollectionAlias);

	const { value, joins } = convertTarget(nestedTarget.field, externalCollectionAlias, indexGen);

	return {
		value,
		joins: [join, ...joins],
	};
}
