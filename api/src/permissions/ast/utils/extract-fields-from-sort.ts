import type { Query } from '@directus/types';
import type { FieldMap, QueryPath } from '../types.js';
import { getInfoForPath } from './get-info-for-path.js';

export function extractFieldsFromSort(collection: string, sort: Query['sort'], fieldMap: FieldMap, path: QueryPath) {
	if (!sort) return;

	const info = getInfoForPath(fieldMap, path, collection);

	for (const field of sort) {
		info.fields.add(field);
	}
}
