import { createCollectionForbiddenError, createFieldsForbiddenError } from './create-error.js';
import type { SchemaOverview } from '@directus/types';

export function validatePathExistence(path: string, collection: string, fields: Set<string>, schema: SchemaOverview) {
	const collectionInfo = schema.collections[collection];

	if (collectionInfo === undefined) {
		throw createCollectionForbiddenError(path, collection);
	}

	const requestedFields = Array.from(fields);

	const nonExistentFields = requestedFields.filter((field) => collectionInfo.fields[field] === undefined);

	if (nonExistentFields.length > 0) {
		throw createFieldsForbiddenError(path, collection, nonExistentFields);
	}
}
