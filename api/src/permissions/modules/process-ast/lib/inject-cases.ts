import type { Filter, Permission } from '@directus/types';
import type { AST, FieldNode, FunctionFieldNode, NestedCollectionNode } from '../../../../types/ast.js';
import { getUnaliasedFieldKey } from '../../../utils/get-unaliased-field-key.js';
import type { FieldKey } from '../types.js';
import { dedupeAccess } from '../utils/dedupe-access.js';
import { hasItemPermissions } from '../utils/has-item-permissions.js';
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

function getCases(collection: string, permissions: Permission[], requestedKeys: string[]) {
	const permissionsForCollection = permissions.filter((permission) => permission.collection === collection);

	const rules = dedupeAccess(permissionsForCollection);
	const cases: Filter[] = [];
	const caseMap: Record<FieldKey, number[]> = {};

	// TODO this can be optimized if there is only one rule to skip the whole case/where system,
	//  since fields that are not allowed at all are already filtered out

	// TODO this can be optimized if all cases are the same for all requested keys, as those should be
	//

	let index = 0;

	for (const { rule, fields } of rules) {
		// If none of the fields in the current permissions rule overlap with the actually requested
		// fields in the AST, we can ignore this case altogether
		if (
			requestedKeys.length > 0 &&
			fields.has('*') === false &&
			Array.from(fields).every((field) => requestedKeys.includes(field) === false)
		) {
			continue;
		}

		if (rule === null) continue;

		cases.push(rule);

		for (const field of fields) {
			caseMap[field] = [...(caseMap[field] ?? []), index];
		}

		index++;
	}

	// Field that are allowed no matter what conditions exist for the item. These come from
	// permissions where the item read access is "everything"
	const allowedFields = new Set(
		permissionsForCollection
			.filter((permission) => hasItemPermissions(permission) === false)
			.map((permission) => permission.fields ?? [])
			.flat(),
	);

	return {
		cases,
		caseMap,
		allowedFields,
	};
}
