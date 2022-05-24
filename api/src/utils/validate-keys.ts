import { SchemaOverview } from '@directus/shared/types';
import { ForbiddenException } from '../exceptions';
import { PrimaryKey } from '../types';
import validateUUID from 'uuid-validate';

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
