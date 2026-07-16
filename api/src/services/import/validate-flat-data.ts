import { InvalidPayloadError } from '@directus/errors';
import type { ImportCollectionData } from '@directus/types';
import { isObject } from '@directus/utils';
import type { AliasFieldInfo, FkFieldInfo } from '../../utils/build-import-plan.js';

/**
 * Reject nested relational payloads: any relational field (owning FK or o2m/m2m alias) whose value
 * is an object, or an array containing an object. Ignores non-relational fields like json, csv, etc.
 */
export function validateFlatData(
	fkFieldsMap: Map<string, FkFieldInfo[]>,
	aliasFieldsMap: Map<string, AliasFieldInfo[]>,
	dataByCollection: Map<string, ImportCollectionData>,
): void {
	for (const [collection, entry] of dataByCollection) {
		const fkFields = fkFieldsMap.get(collection) ?? [];
		const aliasFields = aliasFieldsMap.get(collection) ?? [];

		if (fkFields.length === 0 && aliasFields.length === 0) {
			continue;
		}

		for (const item of entry.items) {
			for (const info of fkFields) {
				validateFlatValue(collection, info.field, item[info.field]);
			}

			for (const info of aliasFields) {
				validateFlatValue(collection, info.field, item[info.field]);
			}
		}
	}
}


function validateFlatValue(collection: string, field: string, value: unknown) {
	if (value === undefined || value === null) return;

	// check for nested relational objects
	if (isObject(value) || (Array.isArray(value) && value.some((entry) => isObject(entry)))) {
		throw new InvalidPayloadError({
			reason: `Nested relational data is not supported for "${collection}.${field}"; provide a scalar foreign key reference instead`,
		});
	}
}