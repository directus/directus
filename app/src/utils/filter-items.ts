import { FieldFilter, Filter, Item } from '@directus/types';
import { generateJoi } from '@directus/utils';

/**
 * Filters an in-memory list of items using the same Filter syntax the API uses for database
 * queries. Useful for views that already hold their data client-side (e.g. the flows list) and so
 * can't push the filter down to an API query.
 *
 * Rules that reach into a relation (e.g. `{ folder: { name: { _eq: 'x' } } }`) only match when the
 * item carries the related object rather than its foreign key, since there's nothing to join
 * against here. Callers that want those rules to work should hydrate the relation first.
 */
export function filterItems<T extends Item>(items: T[], filter: Filter | null): T[] {
	if (!filter) {
		return items;
	}

	return items.filter((item) => passesFilter(item, filter));

	function passesFilter(item: Item, filter: Filter): boolean {
		if (!filter || Object.keys(filter).length === 0) {
			return true;
		}

		const key = Object.keys(filter)[0]!;

		if (key === '_and') {
			const subFilters = Object.values(filter)[0] as Filter[];
			return subFilters.every((subFilter) => passesFilter(item, subFilter));
		}

		if (key === '_or') {
			const subFilters = Object.values(filter)[0] as Filter[];
			return subFilters.some((subFilter) => passesFilter(item, subFilter));
		}

		try {
			const { error } = generateJoi(filter as FieldFilter).validate(item);
			return error === undefined;
		} catch {
			// Unsupported leaf (e.g. _json), or a path the item doesn't carry
			return false;
		}
	}
}
