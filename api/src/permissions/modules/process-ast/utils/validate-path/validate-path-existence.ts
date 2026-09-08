import type { SchemaOverview } from '@directus/types';
import { createCollectionForbiddenError, createFieldsForbiddenError } from './create-error.js';

export function validatePathExistence(path: string, collection: string, fields: Set<string>, schema: SchemaOverview) {
	const collectionInfo = schema.collections[collection];

	if (collectionInfo === undefined) {
		throw createCollectionForbiddenError(path, collection);
	}

	const requestedFields = Array.from(fields);

	// Own-property check: an inherited key (`toString`, `__proto__`, …) is not a field of the collection
	const nonExistentFields = requestedFields.filter((field) => Object.hasOwn(collectionInfo.fields, field) === false);

	if (nonExistentFields.length > 0) {
		throw createFieldsForbiddenError(path, collection, nonExistentFields);
	}
}
