import type { CollectionKey, FieldMap, QueryPath } from '../types.js';

/**
 * Entry of the field map group for the path, created for the collection if it doesn't exist yet
 */
export function getInfoForPath(fieldMap: FieldMap, group: keyof FieldMap, path: QueryPath, collection: CollectionKey) {
	const pathStr = path.join('.');

	if (fieldMap[group].has(pathStr) === false) {
		fieldMap[group].set(pathStr, { collection, fields: new Set() });
	}

	return fieldMap[group].get(pathStr)!;
}
