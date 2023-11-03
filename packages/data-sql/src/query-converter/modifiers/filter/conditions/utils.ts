import type {
	AbstractQueryFieldNodeNestedTarget,
	AbstractQueryFieldNodePrimitive,
	ActualConditionNodes,
} from '@directus/data';
import type {
	AbstractSqlQueryFnNode,
	AbstractSqlQuerySelectNode,
	AbstractSqlQueryJoinNode,
} from '../../../../types/index.js';
import { convertFn } from '../../../functions.js';
import { createJoin } from '../../../fields/create-join.js';
import { createUniqueAlias } from '../../../../orm/create-unique-alias.js';

/**
 * It adds the table name to the node.
 * @param collection
 * @param primitiveNode
 * @returns an unambitious column
 */
export function convertPrimitive(
	collection: string,
	primitiveNode: AbstractQueryFieldNodePrimitive
): AbstractSqlQuerySelectNode {
	return {
		type: 'primitive',
		table: collection,
		column: primitiveNode.field,
	};
}

export interface TargetConversionResult {
	target: AbstractSqlQuerySelectNode | AbstractSqlQueryFnNode;
	joins: AbstractSqlQueryJoinNode[];
}

export function convertTarget(
	condition: ActualConditionNodes,
	collection: string,
	generator: Generator
): TargetConversionResult {
	let target: AbstractSqlQueryFnNode | AbstractSqlQuerySelectNode;
	const joins: AbstractSqlQueryJoinNode[] = [];

	if (condition.target.type === 'primitive') {
		target = {
			type: 'primitive',
			table: collection,
			column: condition.target.field,
		};
	} else if (condition.target.type === 'fn') {
		const convertedFn = convertFn(collection, condition.target, generator);
		target = convertedFn.fn;
	} else if (condition.target.type === 'nested-one-target') {
		const res = convertNestedOneTarget(collection, condition.target);
		joins.push(res.join);
		target = res.target;
	} else {
		throw new Error('The related field types are not yet supported.');
	}

	return { target, joins };
}

/**
 * Convert a nested one target node into a join and where clause.
 * @param nestedTarget
 */
export function convertNestedOneTarget(
	currentCollection: string,
	nestedTarget: AbstractQueryFieldNodeNestedTarget
): {
	target: AbstractSqlQuerySelectNode;
	join: AbstractSqlQueryJoinNode;
} {
	// @ts-ignore we're currently operating only on m2o
	const externalCollectionAlias = createUniqueAlias(nestedTarget.meta.join.foreign.collection);

	return {
		target: {
			type: 'primitive',
			// @ts-ignore the collection does not exist on AbstractQueryFieldNodeRelationalJoinAny
			table: nestedTarget.meta.join.foreign.collection,
			// @ts-ignore @TODO: fix this, why is there a type mismatch?
			column: nestedTarget.field.field,
		},
		// @ts-ignore a2o and m2o mismatch
		join: createJoin(currentCollection, nestedTarget.meta, externalCollectionAlias),
	};
}
