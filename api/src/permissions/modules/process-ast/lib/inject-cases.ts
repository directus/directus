import type { Permission } from '@directus/types';
import { uniq } from 'lodash-es';
import type { AST, FieldNode, FunctionFieldNode, NestedCollectionNode } from '../../../../types/ast.js';
import { getUnaliasedFieldKey } from '../../../utils/get-unaliased-field-key.js';
import { getCases } from './get-cases.js';

/**
 * Mutates passed AST
 *
 * @param ast - Read query AST
 * @param permissions - Expected to be filtered down for the policies and action already
 */
export function injectCases(ast: AST, permissions: Permission[]) {
	ast.cases = processChildren(ast.name, ast.children, permissions);
}

type ChildNode = NestedCollectionNode | FieldNode | FunctionFieldNode;

function processChildren(
	collection: string,
	children: ChildNode[],
	permissions: Permission[],
) {
	// Use uniq here, since there might be multiple duplications due to aliases or functions
	const requestedKeys = uniq(children.map(getUnaliasedFieldKey));
	const { cases, caseMap, allowedFields } = getCases(collection, permissions, requestedKeys);

	// TODO this can be optimized if there is only one rule to skip the whole case/where system,
	//  since fields that are not allowed at all are already filtered out

	// TODO this can be optimized if all cases are the same for all requested keys, as those should be
	//

	// Handles whenCase and handlers set cases.
	for (const child of children) {
		const fieldKey = getUnaliasedFieldKey(child);

		const globalWhenCase = caseMap['*'];
		const fieldWhenCase = caseMap[fieldKey];

		// Validation should catch any fields that are attempted to be read that don't have any access control configured.
		// When there are no access rules for this field, and no rules for "all" fields `*`, we missed something in the validation
		// and should abort.
		if (!globalWhenCase && !fieldWhenCase) {
			throw new Error(`Cannot extract access permissions for field "${fieldKey}" in collection "${collection}"`);
		}

		// The case/when system only needs to take place if no full access is given on this field,
		// otherwise we can skip and thus safe some query perf overhead
		if (!allowedFields.has('*') && !allowedFields.has(fieldKey)) {
			// Global and field can't both be undefined as per the error check prior
			child.whenCase = [...(globalWhenCase ?? []), ...(fieldWhenCase ?? [])];
		}

		// Dispatch table for node-type-specific recursion.
		const handlers: Record<string, (node: ChildNode) => void> = {
			m2o: (node) => {
				// m2o recursion.
				const typed = node as Extract<ChildNode, { type: 'm2o' }>;
				typed.cases = processChildren(typed.relation.related_collection!, typed.children, permissions);
			},
			o2m: (node) => {
				// o2m recursion.
				const typed = node as Extract<ChildNode, { type: 'o2m' }>;
				typed.cases = processChildren(typed.relation.collection, typed.children, permissions);
			},
			a2o: (node) => {
				// a2o recursion per name key.
				const typed = node as Extract<ChildNode, { type: 'a2o' }>;
				for (const collection of typed.names) {
					typed.cases[collection] = processChildren(
						collection,
						typed.children[collection] ?? [],
						permissions,
					);
				}
			},
			functionField: (node) => {
				// functionField loads cases directly.
				const typed = node as Extract<ChildNode, { type: 'functionField' }>;
				const { cases } = getCases(typed.relatedCollection, permissions, []);
				typed.cases = cases;
			},
		};

		// Fail fast on unknown node types.
		if (typeof (child as any).type === 'string') {
			const nodeType = (child as any).type as string;
			const handler = handlers[nodeType];

			if (handler) {
				handler(child);
			} else {
				throw new Error(`Cannot inject cases: unhandled AST node type "${nodeType}"`);
			}
		}
	}

	return cases;
}
