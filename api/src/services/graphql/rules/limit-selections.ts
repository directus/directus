import { DEFAULTS, useEnv } from '@directus/env';
import type { FragmentDefinitionNode, SelectionSetNode, ValidationRule } from 'graphql';
import { GraphQLError, Kind } from 'graphql';

/**
 * Count the fields an operation selects once every fragment in it is expanded, as the resolvers
 * will expand them.
 *
 * Fragments let a document reuse a selection set under any number of fields, so the expanded size
 * can grow exponentially with the size of the document, e.g. `Fk { a: f { ...Fk-1 } b: f { ...Fk-1 } }`.
 * Each fragment's size is therefore computed once and reused, which keeps this linear in the size
 * of the document no matter how large the expansion is.
 *
 * A fragment spread more than once into the same selection set is only counted once per selection
 * list it is written in, so the result can overestimate what the resolvers build, never underestimate.
 */
export function countSelections(
	selectionSet: SelectionSetNode,
	getFragment: (name: string) => FragmentDefinitionNode | null | undefined,
): number {
	const fragmentSizes = new Map<string, number>();

	const count = (selectionSet: SelectionSetNode): number => {
		const spread = new Set<string>();
		let total = 0;

		for (const selection of selectionSet.selections) {
			if (selection.kind === Kind.FIELD) {
				total += 1 + (selection.selectionSet ? count(selection.selectionSet) : 0);
			} else if (selection.kind === Kind.INLINE_FRAGMENT) {
				total += count(selection.selectionSet);
			} else {
				const name = selection.name.value;

				if (spread.has(name)) continue;

				spread.add(name);
				total += sizeOfFragment(name);
			}
		}

		return total;
	};

	const sizeOfFragment = (name: string): number => {
		const known = fragmentSizes.get(name);
		if (known !== undefined) return known;

		const fragment = getFragment(name);

		// Unknown and cyclic fragments are reported by `KnownFragmentNames` and `NoFragmentCycles`.
		// Recording the size before walking in makes a cycle contribute nothing instead of recursing forever.
		fragmentSizes.set(name, 0);

		if (!fragment) return 0;

		const size = count(fragment.selectionSet);
		fragmentSizes.set(name, size);

		return size;
	};

	return count(selectionSet);
}

/**
 * GraphQL validation rule that rejects operations selecting more than `GRAPHQL_QUERY_SELECTION_LIMIT`
 * fields once their fragments are expanded. Runs before any resolver, so a document that would
 * expand to an exponential number of fields is rejected without ever being expanded.
 */
export function limitSelections(operationName?: string | null): ValidationRule {
	const configured = Number(useEnv()['GRAPHQL_QUERY_SELECTION_LIMIT']);
	// `Infinity` is honored as an explicit opt-out
	const max = configured > 0 ? configured : Number(DEFAULTS['GRAPHQL_QUERY_SELECTION_LIMIT']);

	return (context) => ({
		OperationDefinition(operation): void {
			// Only validate the operation that will be executed.
			if (operationName != null && operation.name?.value !== operationName) return;

			if (countSelections(operation.selectionSet, (name) => context.getFragment(name)) > max) {
				context.reportError(
					new GraphQLError(`Query exceeds the maximum allowed selection count of ${max} after expanding fragments`, {
						nodes: operation,
					}),
				);
			}
		},
	});
}
