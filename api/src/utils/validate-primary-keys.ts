import { SchemaOverview } from '@directus/shared/types';
import { ForbiddenException } from '../exceptions';
import { PrimaryKey } from '../types';
import validateUUID from 'uuid-validate';

/**
 * Validate primary keys based on its type
 */
export function validatePrimaryKeys(
	schema: SchemaOverview,
	collection: string,
	primaryKeyField: string,
	keys: PrimaryKey | PrimaryKey[]
) {
	if (Array.isArray(keys)) {
		for (const key of keys) {
			validatePrimaryKeys(schema, collection, primaryKeyField, key);
		}
	} else {
		const primaryKeyFieldType = schema.collections[collection].fields[primaryKeyField].type;
		if (primaryKeyFieldType === 'uuid' && !validateUUID(String(keys))) {
			throw new ForbiddenException();
		} else if (primaryKeyFieldType === 'integer' && !Number.isInteger(Number(keys))) {
			throw new ForbiddenException();
		}
	}
}
