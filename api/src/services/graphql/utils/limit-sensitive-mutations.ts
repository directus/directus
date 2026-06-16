import type {
	FieldNode,
	FragmentDefinitionNode,
	OperationDefinitionNode,
	SelectionSetNode,
	ValidationRule,
} from 'graphql';
import { GraphQLError, Kind } from 'graphql';

/**
 * System mutations that perform expensive or sensitive side effects (account
 * lockout counters, outbound email, user creation) and are reachable
 * anonymously.
 */
export const SINGLE_USE_SYSTEM_MUTATIONS = new Set([
	'auth_login',
	'auth_password_request',
	'auth_password_reset',
	'users_register',
]);

const MAX_INVOCATIONS_PER_OPERATION = 1;

export interface SensitiveMutationInvocation {
	fieldName: string;
	count: number;
	node: FieldNode;
}

/**
 * Walk a mutation operation's selection set, resolving fragment spreads and
 * inline fragments, and return the first {@link SINGLE_USE_SYSTEM_MUTATIONS}
 * invocation whose running per-operation count exceeds `max`, or `undefined`
 * if every sensitive mutation stays within the limit.
 *
 * The walk short-circuits as soon as a violation is found — there is no point
 * traversing the rest of the operation once we know the request must be
 * rejected. A path-scoped `visiting` set guards against fragment cycles
 * (reported separately by `NoFragmentCycles`) while still letting the same
 * fragment be spread more than once at the root.
 */
export function findExcessiveSensitiveMutation(
	operation: OperationDefinitionNode,
	getFragment: (name: string) => FragmentDefinitionNode | null | undefined,
	max = MAX_INVOCATIONS_PER_OPERATION,
): SensitiveMutationInvocation | undefined {
	const counts = new Map<string, number>();

	const walk = (selectionSet: SelectionSetNode, visiting: Set<string>): SensitiveMutationInvocation | undefined => {
		for (const selection of selectionSet.selections) {
			if (selection.kind === Kind.FIELD) {
				const fieldName = selection.name.value;
				if (!SINGLE_USE_SYSTEM_MUTATIONS.has(fieldName)) continue;

				const count = (counts.get(fieldName) ?? 0) + 1;
				counts.set(fieldName, count);

				if (count > max) return { fieldName, count, node: selection };
			} else if (selection.kind === Kind.INLINE_FRAGMENT) {
				const excess = walk(selection.selectionSet, visiting);
				if (excess) return excess;
			} else if (selection.kind === Kind.FRAGMENT_SPREAD) {
				const name = selection.name.value;
				if (visiting.has(name)) continue;

				const fragment = getFragment(name);
				if (!fragment) continue;

				visiting.add(name);
				const excess = walk(fragment.selectionSet, visiting);
				visiting.delete(name);
				if (excess) return excess;
			}
		}

		return undefined;
	};

	return walk(operation.selectionSet, new Set());
}

/**
 * GraphQL validation rule that rejects operations invoking any
 * {@link SINGLE_USE_SYSTEM_MUTATIONS} field more than
 * `MAX_INVOCATIONS_PER_OPERATION` times (aliases included).
 *
 * Validation happens before execution, so the request is refused before any
 * argon2 work, lockout-counter increment, or email send takes place. Counting
 * is scoped to each mutation operation, and — when `operationName` is provided
 * — restricted to the single operation that will actually execute, so bundling
 * several named mutations and running only one of them is never falsely
 * rejected.
 */
export function limitSensitiveMutations(operationName?: string | null): ValidationRule {
	return (context) => {
		const mutationType = context.getSchema().getMutationType();

		return {
			OperationDefinition(operation): void {
				if (!mutationType || operation.operation !== 'mutation') return;

				// Only validate the operation that will be executed. When an
				// operationName is supplied, anything that doesn't match it (including
				// anonymous operations) is skipped.
				if (operationName != null && operation.name?.value !== operationName) return;

				const excess = findExcessiveSensitiveMutation(operation, (name) => context.getFragment(name));

				if (excess) {
					context.reportError(
						new GraphQLError(`"${excess.fieldName}" can only be used once per request`, { nodes: excess.node }),
					);
				}
			},
		};
	};
}
