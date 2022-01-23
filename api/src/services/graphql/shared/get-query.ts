import { Accountability, Filter, Query } from '@directus/shared/types';
import { FieldNode, GraphQLResolveInfo, InlineFragmentNode, SelectionNode } from 'graphql';
import { get, isObject, mapKeys, merge, set, transform, uniq } from 'lodash';
import { sanitizeQuery } from '../../../utils/sanitize-query';
import { validateQuery } from '../../../utils/validate-query';
import { parseArgs } from './parse-args';

/**
 * Get a Directus Query object from the parsed arguments (rawQuery) and GraphQL AST selectionSet. Converts SelectionSet into
 * Directus' `fields` query for use in the resolver. Also applies variables where appropriate.
 */
export const getQuery = (
	rawQuery: Query,
	selections: readonly SelectionNode[],
	variableValues: GraphQLResolveInfo['variableValues'],
	accountability: Accountability | null
): Query => {
	const query: Query = sanitizeQuery(rawQuery, accountability);

	const parseAliases = (selections: readonly SelectionNode[]) => {
		const aliases: Record<string, string> = {};

		for (const selection of selections) {
			if (selection.kind !== 'Field') continue;

			if (selection.alias?.value) {
				aliases[selection.alias.value] = selection.name.value;
			}
		}

		return aliases;
	};

	const parseFields = (selections: readonly SelectionNode[], parent?: string): string[] => {
		const fields: string[] = [];

		for (let selection of selections) {
			if ((selection.kind === 'Field' || selection.kind === 'InlineFragment') !== true) continue;

			selection = selection as FieldNode | InlineFragmentNode;

			let current: string;

			// Union type (Many-to-Any)
			if (selection.kind === 'InlineFragment') {
				if (selection.typeCondition!.name.value.startsWith('__')) continue;

				current = `${parent}:${selection.typeCondition!.name.value}`;
			}
			// Any other field type
			else {
				// filter out graphql pointers, like __typename
				if (selection.name.value.startsWith('__')) continue;

				current = selection.name.value;

				if (parent) {
					current = `${parent}.${current}`;
				}
			}

			if (selection.selectionSet) {
				let children: string[];

				if (current.endsWith('_func')) {
					children = [];

					const rootField = current.slice(0, -5);

					for (const subSelection of selection.selectionSet.selections) {
						if (subSelection.kind !== 'Field') continue;
						children.push(`${subSelection.name!.value}(${rootField})`);
					}
				} else {
					children = parseFields(selection.selectionSet.selections, current);
				}

				fields.push(...children);
			} else {
				fields.push(current);
			}

			if (selection.kind === 'Field' && selection.arguments && selection.arguments.length > 0) {
				if (selection.arguments && selection.arguments.length > 0) {
					if (!query.deep) query.deep = {};

					const args: Record<string, any> = parseArgs(selection.arguments, variableValues);

					set(
						query.deep,
						current,
						merge(
							get(query.deep, current),
							mapKeys(sanitizeQuery(args, accountability), (value, key) => `_${key}`)
						)
					);
				}
			}
		}

		return uniq(fields);
	};

	const replaceFuncs = (filter?: Filter | null): null | undefined | Filter => {
		if (!filter) return filter;

		return replaceFuncDeep(filter);

		function replaceFuncDeep(filter: Record<string, any>) {
			return transform(filter, (result: Record<string, any>, value, key) => {
				let currentKey = key;

				if (typeof key === 'string' && key.endsWith('_func')) {
					const functionName = Object.keys(value)[0]!;
					currentKey = `${functionName}(${currentKey.slice(0, -5)})`;

					result[currentKey] = Object.values(value)[0]!;
				} else {
					result[currentKey] = isObject(value) ? replaceFuncDeep(value) : value;
				}
			});
		}
	};

	query.alias = parseAliases(selections);
	query.fields = parseFields(selections);
	query.filter = replaceFuncs(query.filter);

	validateQuery(query);

	return query;
};
