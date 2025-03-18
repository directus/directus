import type { PrimaryKey, SchemaOverview } from '@directus/types';

export interface ConvertPKContext {
	schema: SchemaOverview;
}

/**
 * Attempt to convert the PK to its proper type
 */
export function convertPK(collection: string, pk: PrimaryKey | undefined, context: ConvertPKContext): PrimaryKey {
	if (!pk) return '';

	const primaryKeyField = context.schema.collections[collection]?.primary;
	const primaryKeyFieldType = context.schema.collections[collection]?.fields[primaryKeyField!]?.type;

	if (primaryKeyFieldType !== 'integer') {
		return pk;
	}

	if (Number.isSafeInteger(Number(pk)) === false) {
		return pk;
	}

	return Number(pk);
}
