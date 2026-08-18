import { isPlainObject } from 'lodash';
import { useFieldsStore } from '@/stores/fields';
import { getRelatedCollection } from '@/utils/get-related-collection';

export type RelationalChanges = {
	create?: Record<string, any>[];
	update?: Record<string, any>[];
	delete?: (string | number)[];
};

const CHANGE_KEYS = ['create', 'update', 'delete'];

/**
 * Whether a value has the `{ create, update, delete }` shape the app uses to stage relational edits.
 */
export function isRelationalChanges(value: unknown): value is RelationalChanges {
	if (!isPlainObject(value)) return false;

	const keys = Object.keys(value as object).filter((key) => !key.startsWith('_') && !key.startsWith('$'));

	if (keys.length === 0) return false;

	return keys.every((key) => CHANGE_KEYS.includes(key) && Array.isArray((value as Record<string, any>)[key]));
}

/**
 * Whether a value holds staged relational edits at any depth. Purely shape based, so it can gate the
 * schema lookups below without paying for them on items that have nothing to resolve.
 */
export function containsRelationalChanges(value: unknown): boolean {
	if (isRelationalChanges(value)) return true;
	if (Array.isArray(value)) return value.some(containsRelationalChanges);
	if (isPlainObject(value)) return Object.values(value as object).some(containsRelationalChanges);

	return false;
}

/**
 * Resolve staged relational edits on an item into the plain arrays a display template expects.
 *
 * Edits to a nested relation are staged as a `{ create, update, delete }` delta, so a path like
 * `{{translations.title}}` cannot resolve against them and renders as `--`. This applies the delta
 * against the values already fetched for the item, for display purposes only: the staged edits that
 * get saved are left untouched.
 *
 * @param collection - Collection the item belongs to
 * @param item - Item carrying the staged edits
 * @param existing - Item as currently stored, if any, to apply the delta against
 */
export function resolveRelationalChanges(
	collection: string,
	item: Record<string, any>,
	existing?: Record<string, any>,
): Record<string, any> {
	const result: Record<string, any> = { ...item };

	for (const [field, value] of Object.entries(item)) {
		if (field.startsWith('$') || !containsRelationalChanges(value)) continue;

		const related = getRelatedCollection(collection, field);
		const nestedCollection = related?.junctionCollection ?? related?.relatedCollection;

		if (!nestedCollection) continue;

		const nestedExisting = existing?.[field];

		if (isRelationalChanges(value)) {
			result[field] = applyChanges(nestedCollection, nestedExisting, value);
		} else if (isPlainObject(value)) {
			// A to-one relation, which can itself hold edits to its own nested relations
			result[field] = resolveRelationalChanges(
				nestedCollection,
				value,
				isPlainObject(nestedExisting) ? nestedExisting : undefined,
			);
		}
	}

	return result;
}

function applyChanges(collection: string, existing: unknown, changes: RelationalChanges): Record<string, any>[] {
	const primaryKeyField = useFieldsStore().getPrimaryKeyFieldForCollection(collection)?.field;
	const updates = changes.update ?? [];
	const deletions = new Set(changes.delete ?? []);

	const fetched = (Array.isArray(existing) ? existing : [])
		// Nested values may come back as bare primary keys rather than objects
		.map((entry) => {
			if (isPlainObject(entry)) return entry as Record<string, any>;
			return primaryKeyField ? { [primaryKeyField]: entry } : null;
		})
		.filter((entry): entry is Record<string, any> => entry !== null);

	const primaryKeyOf = (entry: Record<string, any>) => (primaryKeyField ? entry[primaryKeyField] : undefined);

	// Both sides need a primary key to be matched up. A multi-hop template such as
	// `translations.language.name` only augments the leaf primary key, so the rows in between can come
	// back without one, and appending their updates would duplicate them instead of merging.
	const matchable = fetched.every((entry) => primaryKeyOf(entry) !== undefined);

	const items = fetched
		.filter((entry) => !matchable || !deletions.has(primaryKeyOf(entry)))
		.map((entry) => {
			if (!matchable) return entry;

			const edits = updates.find((update) => isPlainObject(update) && primaryKeyOf(update) === primaryKeyOf(entry));

			return edits ? resolveRelationalChanges(collection, { ...entry, ...edits }, entry) : entry;
		});

	if (matchable) {
		// Existing items newly related to this one only live in `update`, so they have no fetched counterpart
		const present = new Set(items.map((entry) => primaryKeyOf(entry)));

		for (const update of updates) {
			if (!isPlainObject(update)) continue;

			const primaryKey = primaryKeyOf(update);

			// A row edited and then removed before saving sits in both `update` and `delete`; removal wins
			if (present.has(primaryKey) || deletions.has(primaryKey)) continue;

			items.push(resolveRelationalChanges(collection, update));
		}
	}

	for (const creation of changes.create ?? []) {
		items.push(resolveRelationalChanges(collection, creation));
	}

	return items;
}
