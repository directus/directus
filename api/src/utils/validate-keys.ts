import { ForbiddenError } from '@directus/errors';
import type { PrimaryKey, SchemaOverview } from '@directus/types';
import { isValidUuid } from './is-valid-uuid.js';

/**
 * Validate keys based on its type
 */
export function validateKeys(
	schema: SchemaOverview,
	collection: string,
	keyField: string,
	keys: PrimaryKey,
): PrimaryKey;
export function validateKeys(
	schema: SchemaOverview,
	collection: string,
	keyField: string,
	keys: PrimaryKey[],
): PrimaryKey[];
export function validateKeys(
	schema: SchemaOverview,
	collection: string,
	keyField: string,
	keys: PrimaryKey | PrimaryKey[],
) {
	if (Array.isArray(keys)) {
		return keys.map((key) => validateKeys(schema, collection, keyField, key));
	} else {
		const primaryKeyFieldType = schema.collections[collection]?.fields[keyField]?.type;

		if (primaryKeyFieldType === 'uuid') {
			const uuid = String(keys);

			if (!isValidUuid(uuid)) {
				throw new ForbiddenError();
			}

			return uuid;
		} else if (primaryKeyFieldType === 'integer') {
			const key = Number(keys);

			if (!Number.isInteger(key)) {
				throw new ForbiddenError();
			}

			return key;
		}

		return keys;
	}
}
