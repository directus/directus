import type { CollectionOverview, SchemaOverview } from '@directus/types';
import { createCollectionForbiddenError } from '../../permissions/modules/process-ast/utils/validate-path/create-error.js';

type OptionalString = string | null | undefined;

/**
 * Returns a collection from the schema and errors if it does not exist
 *
 * Do not use this util in the CollectionService
 */
export function getCollectionFromSchema(
	schema: SchemaOverview,
	collection: OptionalString,
	field?: OptionalString,
): CollectionOverview {
	const collectionName = collection ?? '';

	if (schema.collections[collectionName]) {
		return schema.collections[collectionName];
	}

	throw createCollectionForbiddenError(field ?? '', collectionName);
}
