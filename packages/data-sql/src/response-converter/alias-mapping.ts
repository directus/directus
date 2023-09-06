/**
 * @see https://app.excalidraw.com/s/DWVAUCmAav/XNAsaVlIY5
 * @module
 */
import type {
	AbstractQueryFieldNode,
	AbstractQueryFieldNodePrimitive,
	AbstractQueryFieldNodeRelatedManyToOne,
} from '@directus/data';
import type { AbstractSqlQueryFnNode, AbstractSqlQueryJoinNode, AbstractSqlQuerySelectNode } from '../index.js';

export const mapAliasesToNestedPaths = (
	collection: string,
	fields: AbstractQueryFieldNode[],
	selects: (AbstractSqlQuerySelectNode | AbstractSqlQueryFnNode)[],
	joins: AbstractSqlQueryJoinNode[],
	path: string[] = []
): Map<string, string[]> => {
	const paths: Map<string, string[]> = new Map();

	for (const abstractField of fields) {
		if (abstractField.type === 'primitive') {
			const as = findGeneratedPrimitiveAlias(abstractField, collection, selects);
			paths.set(as, [...path, abstractField.field]);
			continue;
		}

		if (abstractField.type === 'fn') {
			/* @TODO include function nodes in alias map */
			continue;
		}

		if (abstractField.type === 'm2o') {
			const joinAlias = findGeneratedJoinAlias(abstractField, joins);

			const nested = mapAliasesToNestedPaths(joinAlias, abstractField.nodes, selects, joins, [
				...path,
				abstractField.join.external.collection,
			]);

			nested.forEach((value, key) => paths.set(key, value));

			continue;
		}
	}

	return paths;
};

/*
 * Finds the corresponding node in the abstract sql query and returns the mandatory alias.
 */
function findGeneratedPrimitiveAlias(
	abstractPrimitive: AbstractQueryFieldNodePrimitive,
	collection: string,
	abstractSqlSelects: (AbstractSqlQuerySelectNode | AbstractSqlQueryFnNode)[]
): string {
	const accordingPrimitiveInAbstractSQL = abstractSqlSelects.find((select) => {
		if (select.type !== 'primitive') {
			return false;
		}

		return abstractPrimitive.field === select.column && select.table === collection;
	}) as AbstractSqlQuerySelectNode;

	if (accordingPrimitiveInAbstractSQL === undefined) {
		throw new Error(`No primitive select node found for field ${abstractPrimitive.field}`);
	}

	if (!accordingPrimitiveInAbstractSQL?.as) {
		throw new Error(`Primitive node does not have an unique id as alias.`);
	}

	return accordingPrimitiveInAbstractSQL.as;
}

function findGeneratedJoinAlias(
	relationalField: AbstractQueryFieldNodeRelatedManyToOne,
	joins: AbstractSqlQueryJoinNode[]
): string {
	const joinNode = joins.find((join) => {
		return relationalField.join.external.collection === join.table;
	});

	if (joinNode === undefined) {
		throw new Error(`No sql join node found for to join table ${relationalField.join.external.collection}`);
	}

	return joinNode.as;
}
