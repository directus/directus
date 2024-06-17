import type { Filter, Permission } from '@directus/types';
import hash from 'object-hash';

/**
 * Deduplicate the permissions sets by merging the field sets based on the access control rules
 * (`permissions` in Permission rows)
 *
 * This allows the cases injection to be more efficient by not having to generate duplicate
 * case/when clauses for permission sets where the rule access is identical
 */
export function dedupeAccess(permissions: Permission[]): { rule: Filter; fields: Set<string> }[] {
	// Map of `ruleHash: fields[]`
	const map: Map<string, { rule: Filter; fields: Set<string> }> = new Map();

	for (const permission of permissions) {
		const rule = permission.permissions ?? {};

		// Two JS objects can't be equality checked. Object-hash will resort any nested arrays
		// deterministically meaning that this can be used to compare two rule sets where the array
		// order does not matter
		const ruleHash = hash(rule, {
			algorithm: 'passthrough',
			unorderedArrays: true,
		});

		if (map.has(ruleHash) === false) {
			map.set(ruleHash, { rule, fields: new Set() });
		}

		const info = map.get(ruleHash)!;

		for (const field of permission.fields ?? []) {
			info.fields.add(field);
		}
	}

	return Array.from(map.values());
}
