import type { CollectionKey, FieldKey, QueryPath } from '../types.js';

/**
 * Collection of a path and the fields used within
 */
export type FieldMapEntry = { collection: CollectionKey; fields: Set<FieldKey> };

/**
 * Key is dot-notation QueryPath, f.e. `category.created_by`.
 */
export type FieldMapEntries = Map<string, FieldMapEntry>;

/**
 * Fields touched by an AST, by query path and grouped by the permissions they're validated against
 */
export type FieldMap = {
	/**
	 * Fields that are only used to find the items, in `filter` and `sort`. They require read permission, whatever the
	 * action of the request is.
	 */
	read: FieldMapEntries;
	/**
	 * Fields the action is performed on: fetched fields, including relational fields and function fields, and the fields
	 * of `aggregate` and `group`. They require permission for the action of the request.
	 */
	action: FieldMapEntries;
};

export type FieldMapGroup = keyof FieldMap;

export function createFieldMap(): FieldMap {
	return { read: new Map(), action: new Map() };
}

/**
 * Add the field to the path, which is added for the collection if it isn't yet. Without a field, the path is only
 * added, which still requires access to the collection: the collection is checked to be active, its permissions are
 * loaded and a path without any permissions for its collection is rejected.
 */
export function addToFieldMap(
	fieldMap: FieldMap,
	group: FieldMapGroup,
	path: QueryPath,
	collection: CollectionKey,
	field?: FieldKey,
) {
	const key = path.join('.');
	let entry = fieldMap[group].get(key);

	if (!entry) {
		entry = { collection, fields: new Set() };
		fieldMap[group].set(key, entry);
	}

	if (field) entry.fields.add(field);
}

/**
 * Entries of both groups, for checks that don't depend on the permissions
 */
export function* fieldMapEntries(fieldMap: FieldMap): Generator<[string, FieldMapEntry]> {
	yield* fieldMap.read.entries();
	yield* fieldMap.action.entries();
}

/**
 * Collections of the paths of both groups
 */
export function collectionsInFieldMap(fieldMap: FieldMap): Set<CollectionKey> {
	return new Set([...fieldMapEntries(fieldMap)].map(([, { collection }]) => collection));
}
