import type { Filter, Permission } from '@directus/types';
import { range, uniq } from 'lodash-es';
import { VERSION_SYSTEM_FIELDS } from '../../../../services/version-tables/constants.js';
import type { AST } from '../../../../types/ast.js';
import { type AstLevel, getAstLevels } from '../../../../utils/get-ast-levels.js';
import { getUnaliasedFieldKey } from '../../../utils/get-unaliased-field-key.js';
import { getCases } from './get-cases.js';

type Access = ReturnType<typeof getCases>;

/**
 * Mutates passed AST
 *
 * @param ast - Read query AST
 * @param permissions - Expected to be filtered down for the policies and action already
 */
export function injectCases(ast: AST, permissions: Permission[]) {
	for (const level of getAstLevels(ast)) {
		level.cases = getLevelCases(level, permissions);
	}
}

/**
 * Cases of the level, with the cases that apply to each of its children set on them. The permissions of the shadow
 * table of a versioned level apply to its version rows instead of the ones of the collection.
 */
function getLevelCases({ collection, children, versioning }: AstLevel, permissions: Permission[]) {
	// Use uniq here, since there might be multiple duplications due to aliases or functions
	const requestedKeys = uniq(children.map(getUnaliasedFieldKey));
	const live = getCases(collection, permissions, requestedKeys);
	const versions = versioning?.shadow ? getCases(versioning.shadow, permissions, requestedKeys) : null;

	const cases = versions
		? [...live.cases.map((rule) => withType(rule, '_eq')), ...versions.cases.map((rule) => withType(rule, '_neq'))]
		: live.cases;

	for (const child of children) {
		const fieldKey = getUnaliasedFieldKey(child);

		// Validation should catch any fields that are attempted to be read that don't have any access control configured.
		// When there are no access rules for this field, and no rules for "all" fields `*`, we missed something in the validation
		// and should abort.
		if (!live.caseMap['*'] && !live.caseMap[fieldKey]) {
			throw new Error(`Cannot extract access permissions for field "${fieldKey}" in collection "${collection}"`);
		}

		const liveCases = getFieldCases(live, fieldKey);
		const versionCases = versions ? getFieldCases(versions, fieldKey) : null;

		// The case/when system only needs to take place if no full access is given on this field,
		// otherwise we can skip and thus safe some query perf overhead
		if (!versions) {
			if (liveCases) child.whenCase = liveCases;
		} else if (liveCases || versionCases) {
			// Version rows without access to the field return it as null
			child.whenCase = [
				...(liveCases ?? range(live.cases.length)),
				...(versionCases ?? range(versions.cases.length)).map((index) => index + live.cases.length),
			];
		}

		if (child.type === 'functionField') {
			child.cases = getCases(child.relatedCollection, permissions, []).cases;
		}
	}

	return cases;
}

/**
 * Indexes of the cases that allow reading the field, or null if every row that can be read may read it
 */
function getFieldCases({ caseMap, allowedFields }: Access, fieldKey: string): number[] | null {
	if (allowedFields.has('*') || allowedFields.has(fieldKey)) return null;

	return [...(caseMap['*'] ?? []), ...(caseMap[fieldKey] ?? [])];
}

/**
 * Limit a rule to the live rows (`_eq`) or the version rows (`_neq`) of a versioned read, as live items are read as
 * their published version
 */
function withType(rule: Filter, operator: '_eq' | '_neq'): Filter {
	return { _and: [rule, { [VERSION_SYSTEM_FIELDS.type]: { [operator]: 'published' } }] } as Filter;
}
