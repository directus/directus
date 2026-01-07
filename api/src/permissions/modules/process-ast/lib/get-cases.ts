import type { Filter, Permission } from '@directus/types';
import type { FieldKey } from '../types.js';
import { dedupeAccess } from '../utils/dedupe-access.js';
import { hasItemPermissions } from '../utils/has-item-permissions.js';

export function getCases(collection: string, permissions: Permission[], requestedKeys: string[]) {
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
