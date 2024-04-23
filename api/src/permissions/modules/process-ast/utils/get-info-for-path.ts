import type { CollectionKey, FieldMap, QueryPath } from '../types.js';

export function getInfoForPath(fieldMap: FieldMap, path: QueryPath, collection: CollectionKey) {
	const pathStr = path.join('.');

	if (fieldMap.has(pathStr) === false) {
		fieldMap.set(pathStr, { collection, fields: new Set() });
	}

	return fieldMap.get(pathStr)!;
}
