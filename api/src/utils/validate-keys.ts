import type { SchemaOverview } from '@directus/shared/types';
import { ForbiddenException } from '../exceptions/index.js';
import type { PrimaryKey } from '../types/index.js';
import validateUUID from 'uuid-validate';

/**
 * Validate keys based on its type
 */
export async function validateKeys(
	schema: SchemaOverview,
	collection: string,
	keyField: string,
	keys: PrimaryKey | PrimaryKey[]
) {
	if (Array.isArray(keys)) {
		for (const key of keys) {
			await validateKeys(schema, collection, keyField, key);
		}
	} else {
		const primaryKeyFieldType =  (await schema.getField(collection, keyField))?.type;
		if (primaryKeyFieldType === 'uuid' && !validateUUID(String(keys))) {
			throw new ForbiddenException();
		} else if (primaryKeyFieldType === 'integer' && !Number.isInteger(Number(keys))) {
			throw new ForbiddenException();
		}
	}
}
