import { getCases } from './get-cases.js';
import type { AST, FieldNode, FunctionFieldNode, NestedCollectionNode } from '../../../../types/ast.js';
import { getUnaliasedFieldKey } from '../../../utils/get-unaliased-field-key.js';
import type { Permission } from '@directus/types';
import { uniq } from 'lodash-es';

/**
 * Mutates passed AST
 *
 * @param ast - Read query AST
 * @param permissions - Expected to be filtered down for the policies and action already
 */
export function injectCases(ast: AST, permissions: Permission[]) {
	ast.cases = processChildren(ast.name, ast.children, permissions);
}

function processChildren(
	collection: string,
	children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[],
	permissions: Permission[],
) {
	// Use uniq here, since there might be multiple duplications due to aliases or functions
	const requestedKeys = uniq(children.map(getUnaliasedFieldKey));
	const { cases, caseMap, allowedFields } = getCases(collection, permissions, requestedKeys);

	// TODO this can be optimized if there is only one rule to skip the whole case/where system,
	//  since fields that are not allowed at all are already filtered out

	// TODO this can be optimized if all cases are the same for all requested keys, as those should be
	//

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

		if (child.type === 'm2o') {
			child.cases = processChildren(child.relation.related_collection!, child.children, permissions);
		}

		if (child.type === 'o2m') {
			child.cases = processChildren(child.relation.collection, child.children, permissions);
		}

		if (child.type === 'a2o') {
			for (const collection of child.names) {
				child.cases[collection] = processChildren(collection, child.children[collection] ?? [], permissions);
			}
		}

		if (child.type === 'functionField') {
			const { cases } = getCases(child.relatedCollection, permissions, []);
			child.cases = cases;
		}
	}

	return cases;
}
