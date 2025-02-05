import type { Accountability, Query } from '@directus/types';
import type { FieldNode, GraphQLResolveInfo, InlineFragmentNode, SelectionNode } from 'graphql';
import { get, mapKeys, merge, set, uniq } from 'lodash-es';
import { sanitizeQuery } from '../../../utils/sanitize-query.js';
import { validateQuery } from '../../../utils/validate-query.js';
import { replaceFuncs } from '../utils/replace-funcs.js';
import { parseArgs } from './parse-args.js';

/**
 * Get a Directus Query object from the parsed arguments (rawQuery) and GraphQL AST selectionSet. Converts SelectionSet into
 * Directus' `fields` query for use in the resolver. Also applies variables where appropriate.
 */
export function getQuery(
	rawQuery: Query,
	selections: readonly SelectionNode[],
	variableValues: GraphQLResolveInfo['variableValues'],
	accountability?: Accountability | null,
): Query {
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
			let currentAlias: string | null = null;

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

				if (selection.alias) {
					currentAlias = selection.alias.value;
				}

				if (parent) {
					current = `${parent}.${current}`;

					if (currentAlias) {
						currentAlias = `${parent}.${currentAlias}`;

						// add nested aliases into deep query
						if (selection.selectionSet) {
							if (!query.deep) query.deep = {};

							set(
								query.deep,
								parent,
								merge({}, get(query.deep, parent), { _alias: { [selection.alias!.value]: selection.name.value } }),
							);
						}
					}
				}
			}

			if (selection.selectionSet) {
				let children: string[];

				if (current.endsWith('_func')) {
					children = [];

					const rootField = current.slice(0, -5);

					for (const subSelection of selection.selectionSet.selections) {
						if (subSelection.kind !== 'Field') continue;
						if (subSelection.name!.value.startsWith('__')) continue;
						children.push(`${subSelection.name!.value}(${rootField})`);
					}
				} else {
					children = parseFields(selection.selectionSet.selections, currentAlias ?? current);
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
						currentAlias ?? current,
						merge(
							{},
							get(query.deep, currentAlias ?? current),
							mapKeys(sanitizeQuery(args, accountability), (_value, key) => `_${key}`),
						),
					);
				}
			}
		}

		return uniq(fields);
	};

	query.alias = parseAliases(selections);
	query.fields = parseFields(selections);
	if (query.filter) query.filter = replaceFuncs(query.filter);
	query.deep = replaceFuncs(query.deep as any) as any;

	validateQuery(query);

	return query;
}
