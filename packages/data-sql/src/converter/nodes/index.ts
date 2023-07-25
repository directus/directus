import type { AbstractQueryFieldNode } from '@directus/data';
import type { AbstractSqlQuery } from '../../types/index.js';
import { createUniqueIdentifier } from '../../utils/create-unique-identifier.js';
import { createPrimitiveSelect } from './create-primitive-select.js';
import { createJoin } from './create-join.js';
import { convertFn } from '../functions.js';

export type ConvertSelectOutput = Pick<AbstractSqlQuery, 'select' | 'join' | 'paths' | 'parameters'>;

export const convertNodes = (
	collection: string,
	nodes: AbstractQueryFieldNode[],
	idxGenerator: Generator,
	path: string[] = []
): ConvertSelectOutput => {
	const select: ConvertSelectOutput['select'] = [];
	const join: ConvertSelectOutput['join'] = [];
	const paths: ConvertSelectOutput['paths'] = new Map();
	const parameters: AbstractSqlQuery['parameters'] = [];

	for (const node of nodes) {
		if (node.type === 'primitive') {
			const selectNode = createPrimitiveSelect(collection, node);

			select.push(selectNode);
			paths.set(selectNode.as, [...path, node.alias ?? node.field]);

			continue;
		}

		if (node.type === 'm2o') {
			const externalCollectionAlias = createUniqueIdentifier(node.join.external.collection);

			/**
			 * Always fetch the current context foreign key as well. We need it to check if the current
			 * item has a related item so we don't expand `null` values in a nested object where every
			 * value is null
			 *
			 * @TODO
			 */

			join.push(
				createJoin(
					collection,
					node.join.current.fields,
					node.join.external.collection,
					externalCollectionAlias,
					node.join.external.fields
				)
			);

			const nestedOutput = convertNodes(externalCollectionAlias, node.nodes, idxGenerator, [...path, node.alias]);

			select.push(...nestedOutput.select);
			nestedOutput.paths.forEach((value, key) => paths.set(key, value));

			continue;
		}

		if (node.type === 'fn') {
			const fn = convertFn(collection, node, idxGenerator);
			select.push(fn.fn);
			parameters.push(...fn.parameters);
			continue;
		}

		throw new Error(`Node type ${node.type} is not supported`);
	}

	return { select, join, paths, parameters };
};
