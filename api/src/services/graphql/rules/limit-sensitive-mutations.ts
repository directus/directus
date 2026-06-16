import { useEnv } from '@directus/env';
import type {
	FieldNode,
	FragmentDefinitionNode,
	OperationDefinitionNode,
	SelectionSetNode,
	ValidationRule,
} from 'graphql';
import { GraphQLError, Kind } from 'graphql';

const MAX_INVOCATIONS_PER_OPERATION = 1;

export interface SensitiveMutationLimitError {
	fieldName: string;
	node: FieldNode;
}

/**
 * Walk a mutation operation's selection set, resolving fragment spreads and
 * inline fragments, and return the first invocation of a `sensitiveMutations`
 * field whose running per-operation count exceeds `MAX_INVOCATIONS_PER_OPERATION`,
 * or `undefined` if every sensitive mutation stays within the limit.
 *
 * `sensitiveMutations` is the configured set of guarded field names (see
 * `GRAPHQL_SINGLE_USE_MUTATIONS`).
 */
export function checkSensitiveMutationLimit(
	operation: OperationDefinitionNode,
	getFragment: (name: string) => FragmentDefinitionNode | null | undefined,
	sensitiveMutations: ReadonlySet<string>,
): SensitiveMutationLimitError | undefined {
	const counts = new Map<string, number>();

	const walk = (selectionSet: SelectionSetNode, visiting: Set<string>): SensitiveMutationLimitError | undefined => {
		for (const selection of selectionSet.selections) {
			if (selection.kind === Kind.FIELD) {
				const fieldName = selection.name.value;
				if (!sensitiveMutations.has(fieldName)) continue;

				const count = (counts.get(fieldName) ?? 0) + 1;
				counts.set(fieldName, count);

				if (count > MAX_INVOCATIONS_PER_OPERATION) {
					return { fieldName, node: selection };
				}
			} else if (selection.kind === Kind.INLINE_FRAGMENT) {
				const error = walk(selection.selectionSet, visiting);
				if (error) return error;
			} else if (selection.kind === Kind.FRAGMENT_SPREAD) {
				const name = selection.name.value;
				if (visiting.has(name)) continue;

				const fragment = getFragment(name);
				if (!fragment) continue;

				visiting.add(name);
				const error = walk(fragment.selectionSet, visiting);
				visiting.delete(name);
				if (error) return error;
			}
		}

		return undefined;
	};

	return walk(operation.selectionSet, new Set());
}

/**
 * GraphQL validation rule that rejects operations invoking any mutation listed in
 * `GRAPHQL_SINGLE_USE_MUTATIONS` more than `MAX_INVOCATIONS_PER_OPERATION` times
 * (aliases included). These are system mutations that perform expensive or
 * sensitive side effects (account lockout counters, outbound email, user
 * creation) and are reachable anonymously.
 */
export function limitSensitiveMutations(operationName?: string | null): ValidationRule {
	const env = useEnv();
	const sensitiveMutations = new Set(env['GRAPHQL_SINGLE_USE_MUTATIONS'] as string[]);

	return (context) => {
		const mutationType = context.getSchema().getMutationType();

		return {
			OperationDefinition(operation): void {
				if (!mutationType || operation.operation !== 'mutation') return;

				// Only validate the operation that will be executed.
				if (operationName != null && operation.name?.value !== operationName) return;

				const error = checkSensitiveMutationLimit(operation, (name) => context.getFragment(name), sensitiveMutations);

				if (error) {
					context.reportError(
						new GraphQLError(`"${error.fieldName}" can only be used once per request`, { nodes: error.node }),
					);
				}
			},
		};
	};
}
