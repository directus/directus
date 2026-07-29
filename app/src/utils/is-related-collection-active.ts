import { Field } from '@directus/types';
import { getRelatedCollection } from './get-related-collection';
import { isCollectionActive } from './is-collection-active';
import { useCollectionsStore } from '@/stores/collections';

/**
 * Whether every related collection traversed by a field path is active.
 *
 * Accepts a plain field name (`author`), a nested path (`author.avatar.title`) and m2a scoped keys
 * (`sections:headings.title`), mirroring the notation `fieldsStore.getField` understands. Fields
 * that aren't relational are always considered active.
 */
export function isRelatedCollectionActive(collection: string | null | undefined, fieldPath: string): boolean {
	if (!collection) return true;

	const collectionsStore = useCollectionsStore();
	let current = collection;

	for (const part of fieldPath.split('.')) {
		if (part.includes(':')) {
			// m2a scoped key, e.g. `sections:headings`
			const [, scopedCollection] = part.split(':') as [string, string];

			if (!isCollectionActive(collectionsStore.getCollection(scopedCollection))) return false;

			current = scopedCollection;
			continue;
		}

		const related = getRelatedCollection(current, part);

		// Not relational, so there is nothing left to traverse
		if (!related) return true;

		if (!isCollectionActive(collectionsStore.getCollection(related.relatedCollection))) return false;

		current = related.relatedCollection;
	}

	return true;
}

/**
 * `Field` adapter for `isRelatedCollectionActive`, for use as a `v-field-list` / `useFieldTree`
 * filter or in `Field[]` filters.
 */
export function hasActiveRelatedCollection(field: Field): boolean {
	return isRelatedCollectionActive(field.collection, field.field);
}
