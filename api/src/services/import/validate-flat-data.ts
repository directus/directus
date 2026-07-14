import { InvalidPayloadError } from '@directus/errors';
import type { ImportCollectionData } from '@directus/types';
import { isObject } from '@directus/utils';

/**
 * Reject nested relational payloads: any relational field (owning FK or o2m/alias) whose value is
 * an object, or an array containing an object. Ignores non-relational fields like json, csv, etc.
 */
export function validateFlatData(
	relationalFields: Map<string, Set<string>>,
	dataByCollection: Map<string, ImportCollectionData>,
): void {
	for (const [collection, fields] of relationalFields) {
		if (fields.size === 0) continue;

		const entry = dataByCollection.get(collection);
		if (!entry) continue;

		for (const item of entry.items) {
			for (const field of fields) {
				const value = item[field];
				if (value === undefined || value === null) continue;

				// check for nested relational objects
				if (isObject(value) || (Array.isArray(value) && value.some((entry) => isObject(entry)))) {
					throw new InvalidPayloadError({
						reason: `Nested relational data is not supported for "${collection}.${field}"; provide a scalar foreign key reference instead`,
					});
				}
			}
		}
	}
}
