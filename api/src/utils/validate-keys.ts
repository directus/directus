import type { SchemaOverview } from '@directus/shared/types';
import validateUUID from 'uuid-validate';
import { ForbiddenException } from '../exceptions';
import type { PrimaryKey } from '../types';

/**
 * Validate keys based on its type
 */
export function validateKeys(
	schema: SchemaOverview,
	collection: string,
	keyField: string,
	keys: PrimaryKey | PrimaryKey[]
) {
	if (Array.isArray(keys)) {
		for (const key of keys) {
			validateKeys(schema, collection, keyField, key);
		}
	} else {
		const primaryKeyFieldType = schema.collections[collection].fields[keyField].type;
		if (primaryKeyFieldType === 'uuid' && !validateUUID(String(keys))) {
			throw new ForbiddenException();
		} else if (primaryKeyFieldType === 'integer' && !Number.isInteger(Number(keys))) {
			throw new ForbiddenException();
		}
	}
}
