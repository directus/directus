import type { CollectionOverview, SchemaOverview } from '@directus/types';
import { createCollectionForbiddenError } from '../../permissions/modules/process-ast/utils/validate-path/create-error.js';

type OptionalString = string | null | undefined;

export interface GetCollectionFromSchemaErrorOptions {
	field?: OptionalString;
}

/**
 * Returns a collection from the schema and errors if it does not exist
 */
export function getCollectionFromSchema(
	schema: SchemaOverview,
	collection: OptionalString,
	options?: GetCollectionFromSchemaErrorOptions,
): CollectionOverview {
	const collectionName = collection ?? '';

	if (schema.collections[collectionName]) {
		return schema.collections[collectionName];
	}

	throw createCollectionForbiddenError(options?.field ?? '', collectionName);
}
